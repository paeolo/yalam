import watcher from '@parcel/watcher';
import EventEmitter from 'eventemitter3';
import PQueue from 'p-queue';
import setImmediatePromise from 'set-immediate-promise';
import { from } from 'rxjs';
import {
  map,
  mergeAll
} from 'rxjs/operators';
import deepEqual from 'deep-equal';

import { Cache } from './cache';
import {
  Asset,
  AssetStatus,
  AsyncSubscription,
  InputEvent,
  EventType,
  FileEvent,
  Reporter,
  Task,
} from './types';
import {
  normalizeEntries,
  normalizeOptions,
  unsubscribeAll,
} from './utils';
import {
  DeletedAsset,
  FailedAsset,
  FileAsset
} from './asset';

export interface YalamOptions {
  disableCache?: boolean;
  cacheDir?: string;
  cacheKey?: string;
  reporters?: Reporter[];
  concurrency?: number;
}

interface BuildOptions {
  taskName: string;
  entries: string[];
}

interface EventTypes {
  built: (asset: FileAsset, task: string) => void;
  deleted: (asset: DeletedAsset) => void;
  input: (events: InputEvent[]) => void;
  idle: (events?: FailedAsset[]) => void;
}

interface TaskWithName {
  name: string;
  task: Task;
}

interface BuildEventsOption {
  throwOnFail?: boolean;
}

export class Yalam extends EventEmitter<EventTypes> {
  private options: Required<YalamOptions>;
  private cache: Cache;
  private tasks: Map<string, Task>;
  private ignoredFiles: Set<string>;
  private queue: PQueue;
  private failed: FailedAsset[];

  constructor(options: YalamOptions = {}) {
    super();

    this.options = normalizeOptions(options);
    this.cache = new Cache({
      directory: this.options.cacheDir,
      cacheKey: this.options.cacheKey
    });
    this.tasks = new Map();
    this.ignoredFiles = new Set();
    this.queue = new PQueue({
      concurrency: this.options.concurrency
    });
    this.failed = [];

    this.init(this.options.reporters);
  }

  private init(reporters: Reporter[]) {
    reporters.forEach(
      (reporter) => this.bindReporter(reporter)
    );
    this.bindReporter(this.cache);
    this.queue.on('idle', () => this.emit('idle', this.failed));
  }

  private bindReporter(reporter: Reporter) {
    if (reporter.onBuilt) {
      this.addListener('built', reporter.onBuilt.bind(reporter));
    }
    if (reporter.onDeleted) {
      this.addListener('deleted', reporter.onDeleted.bind(reporter));
    }
    if (reporter.onInput) {
      this.addListener('input', reporter.onInput.bind(reporter));
    }
    if (reporter.onIdle) {
      this.addListener('idle', reporter.onIdle.bind(reporter));
    }
  }

  private get(key: string) {
    const task = this.tasks.get(key);
    if (!task) {
      throw new Error(`Task not found: ${key}`)
    }
    return task;
  }

  private onFailed(asset: FailedAsset) {
    if (!this.failed.some(
      value => deepEqual(value.getEvent(), asset.getEvent())
    )) {
      this.failed.push(asset);
    }
  }

  private onBuilt(task: string, asset: Asset) {
    if (asset.status === AssetStatus.SOURCE) {
      return;
    } else if (asset.status === AssetStatus.FAILED) {
      this.onFailed(asset);
      return;
    }

    this.ignoredFiles.add(asset.getFullPath());
    this.ignoredFiles.add(asset.getFullPath().concat('.map'));
    this.failed = this.failed
      .filter((value) => !(value.getFullPath() === asset.getFullPath()));

    if (asset.status === AssetStatus.ARTIFACT) {
      this.emit('built', asset, task);
    }
    else if (asset.status === AssetStatus.DELETED) {
      this.emit('deleted', asset);
    }
  }

  private getSubscription(task: TaskWithName, entry: string) {
    const onEvents = async (err: Error | null, events: watcher.Event[]) => {
      if (err) {
        throw err;
      }
      const fileEvents = this.getFileEvents(entry, events);
      await setImmediatePromise();

      if (fileEvents.length !== 0) {
        this.queueEvents(task, fileEvents);
      }
    };

    return watcher.subscribe(
      entry,
      onEvents,
      { ignore: [this.options.cacheDir] }
    );
  }

  private getFileEvents(entry: string, events: watcher.Event[]): FileEvent[] {
    return events
      .filter((event) => !this.ignoredFiles.has(event.path))
      .map((event) => ({
        type: event.type === 'delete'
          ? EventType.DELETED
          : EventType.UPDATED,
        entry,
        path: event.path
      }))
  }

  private async buildEvents(taskWithName: TaskWithName, events: InputEvent[], options?: BuildEventsOption) {
    const {
      task,
      name
    } = taskWithName;
    this.emit('input', events);

    await task(from(events))
      .pipe(
        map(asset => {
          if (options
            && options.throwOnFail
            && asset.status === AssetStatus.FAILED) {
            throw asset.getError();
          }
          return from(asset.commit())
        }),
        mergeAll()
      )
      .forEach(
        (asset) => this.onBuilt(name, asset)
      );
  }

  private queueEvents(task: TaskWithName, events: InputEvent[]) {
    return this.queue.add(() => this.buildEvents(task, events));
  }

  private async getInputEvents(entries: string[], task: string): Promise<InputEvent[]> {
    if (this.options.disableCache) {
      return entries.map(entry => ({
        type: EventType.INITIAL,
        path: entry
      }));
    }
    else {
      return this.cache.getInputEvents(entries, task);
    }
  }

  /**
  * @description
  * Add a build task with the provided key to the tasks.
  */
  public addTask(key: string, task: Task) {
    this.tasks.set(key, task);
    return this;
  }

  /**
   * @description
   * Returns a promise resolved when the build succeed.
   */
  public async build(options: BuildOptions) {
    const entries = await normalizeEntries(options.entries);
    const task = this.get(options.taskName);
    const events = await this.getInputEvents(entries, options.taskName);

    await this.buildEvents(
      { name: options.taskName, task },
      events,
      { throwOnFail: true }
    );
    this.emit('idle');
  }

  /**
   * @description
   * Returns a promise resolved when the first build succeed and file are watched.
   */
  public async watch(options: BuildOptions): Promise<AsyncSubscription> {
    const entries = await normalizeEntries(options.entries);
    const task = this.get(options.taskName);
    const events = await this.getInputEvents(entries, options.taskName);

    this.queueEvents(
      { name: options.taskName, task },
      events
    );
    await this.queue.onIdle();

    const subscriptions = await Promise.all(
      entries.map(entry => this.getSubscription(
        { name: options.taskName, task },
        entry)
      )
    );

    return {
      unsubscribe: async () => {
        await unsubscribeAll(subscriptions);
        await this.queue.onIdle();
      }
    }
  }
}
