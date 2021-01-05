import watcher from '@parcel/watcher';
import EventEmitter from 'eventemitter3';
import PQueue from 'p-queue';
import setImmediatePromise from 'set-immediate-promise';
import deepEqual from 'deep-equal';
import { from } from 'rxjs';
import {
  map,
  mergeAll
} from 'rxjs/operators';

import { Cache } from './cache';
import { FileEvent, InitialEvent } from './events';
import {
  Asset,
  AssetStatus,
  AsyncSubscription,
  InputEvent,
  EventType,
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
  task: string;
  entries: string[];
}

interface EventTypes {
  input: (events: InputEvent[]) => void;
  built: (asset: FileAsset, task: string) => void;
  deleted: (asset: DeletedAsset) => void;
  idle: (assets?: FailedAsset[]) => void;
}

interface NamedTask {
  name: string;
  fn: Task;
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
      cacheDir: this.options.cacheDir,
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
    if (reporter.onInput) {
      this.addListener('input', reporter.onInput.bind(reporter));
    }
    if (reporter.onBuilt) {
      this.addListener('built', reporter.onBuilt.bind(reporter));
    }
    if (reporter.onDeleted) {
      this.addListener('deleted', reporter.onDeleted.bind(reporter));
    }
    if (reporter.onIdle) {
      this.addListener('idle', reporter.onIdle.bind(reporter));
    }
  }

  private getNamedTask(key: string): NamedTask {
    const fn = this.tasks.get(key);
    if (!fn) {
      throw new Error(`Task "${key}" is not defined`);
    }
    return {
      name: key,
      fn
    }
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

  private getSubscription(task: NamedTask, entry: string) {
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
      .map((event) => new FileEvent({
        type: event.type === 'delete'
          ? EventType.DELETED
          : EventType.UPDATED,
        entry,
        path: event.path,
        cacheDir: this.options.cacheDir
      }));
  }

  private async buildEvents(task: NamedTask, events: InputEvent[], options?: BuildEventsOption) {
    this.emit('input', events);

    await task.fn(from(events))
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
        (asset) => this.onBuilt(task.name, asset)
      );
  }

  private queueEvents(task: NamedTask, events: InputEvent[]) {
    return this.queue.add(() => this.buildEvents(task, events));
  }

  private async getInputEvents(task: string, entries: string[]): Promise<InputEvent[]> {
    if (this.options.disableCache) {
      return entries.map(entry => new InitialEvent({
        path: entry,
        cacheDir: this.options.cacheDir
      }));
    }
    else {
      return this.cache.getInputEvents(task, entries);
    }
  }

  /**
  * @description
  * Add a build task with the provided key to the tasks.
  */
  public addTask(key: string, fn: Task) {
    this.tasks.set(key, fn);
    return this;
  }

  /**
   * @description
   * Returns a promise resolved when the build succeed.
   */
  public async build(options: BuildOptions) {
    const entries = await normalizeEntries(options.entries);
    const task = this.getNamedTask(options.task);
    const events = await this.getInputEvents(options.task, entries);

    await this.buildEvents(
      task,
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
    const task = this.getNamedTask(options.task);
    const events = await this.getInputEvents(options.task, entries);

    this.queueEvents(
      task,
      events
    );
    await this.queue.onIdle();

    const subscriptions = await Promise.all(
      entries.map(entry => this.getSubscription(
        task,
        entry
      ))
    );

    return {
      unsubscribe: async () => {
        await unsubscribeAll(subscriptions);
        await this.queue.onIdle();
      }
    }
  }
}
