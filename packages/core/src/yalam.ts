import watcher from '@parcel/watcher';
import EventEmitter from 'eventemitter3';
import PQueue from 'p-queue';
import setImmediatePromise from 'set-immediate-promise';
import { from } from 'rxjs';
import {
  map,
  mergeAll,
  publish,
} from 'rxjs/operators';

import { Cache } from './cache';
import {
  FileEventIgnorer,
  FailureService
} from './services';
import {
  FileEvent,
  InitialEvent
} from './events';
import {
  Asset,
  AssetStatus,
  AsyncSubscription,
  InputEvent,
  EventType,
  Reporter,
  Task,
  DirectoryPath,
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

export class Yalam extends EventEmitter<EventTypes> {
  private options: Required<YalamOptions>;
  private cache: Cache;
  private eventIgnorer: FileEventIgnorer;
  private failureService: FailureService;
  private tasks: Map<string, Task>;
  private queue: PQueue;

  constructor(options: YalamOptions = {}) {
    super();

    this.options = normalizeOptions(options);
    this.cache = new Cache({
      cacheDir: this.options.cacheDir,
      cacheKey: this.options.cacheKey
    });
    this.eventIgnorer = new FileEventIgnorer();
    this.failureService = new FailureService();
    this.tasks = new Map();
    this.queue = new PQueue({
      concurrency: this.options.concurrency
    });
    this.init(this.options.reporters);
  }

  private init(reporters: Reporter[]) {
    reporters.forEach(
      (reporter) => this.bindReporter(reporter)
    );
    this.bindReporter(this.cache);
    this.queue.on(
      'idle',
      () => this.emit('idle', this.failureService.getFailures())
    );
  }

  private bindReporter(reporter: Reporter) {
    if (reporter.onInput) {
      this.addListener(
        'input',
        reporter.onInput.bind(reporter)
      );
    }
    if (reporter.onBuilt) {
      this.addListener(
        'built',
        reporter.onBuilt.bind(reporter)
      );
    }
    if (reporter.onDeleted) {
      this.addListener(
        'deleted',
        reporter.onDeleted.bind(reporter)
      );
    }
    if (reporter.onIdle) {
      this.addListener(
        'idle',
        reporter.onIdle.bind(reporter)
      );
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

  private onBuilt(task: string, asset: Asset) {
    switch (asset.status) {
      case AssetStatus.FAILED:
        this.failureService.onFailedAsset(asset);
        break;
      case AssetStatus.ARTIFACT:
        this.eventIgnorer.onFileAsset(asset);
        this.emit('built', asset, task);
        break;
      case AssetStatus.DELETED:
        this.eventIgnorer.onFileAsset(asset);
        this.emit('deleted', asset);
        break;
    }
  }

  private getSubscription(task: NamedTask, entry: DirectoryPath) {
    const onEvents = async (err: Error | null, events: watcher.Event[]) => {
      if (err) {
        throw err;
      }
      const input = events.filter(this.eventIgnorer.getEventFilter(entry));

      if (input.length === 0) {
        return
      }

      this.failureService
        .getEvents(entry)
        .forEach(event => {
          if (!input.some(value => value.path === event.path)) {
            input.push(event);
          }
        });
      this.failureService.clear(entry);
      const fileEvents = this.getFileEvents(entry, input);

      await setImmediatePromise();
      this.queueEvents(task, fileEvents);
    };

    return watcher.subscribe(
      entry,
      onEvents,
      { ignore: [this.options.cacheDir] }
    );
  }

  private getFileEvents(entry: string, events: watcher.Event[]): FileEvent[] {
    return events
      .map((event) => new FileEvent({
        type: event.type === 'delete'
          ? EventType.DELETED
          : EventType.UPDATED,
        cacheDir: this.options.cacheDir,
        cacheKey: this.cache.getHashForEntry(entry),
        entry,
        path: event.path,
      }));
  }

  private async buildEvents(task: NamedTask, events: InputEvent[], throwOnFail: boolean) {
    this.emit('input', events);

    const input = publish<InputEvent>()(from(events));

    const onAsset = (asset: Asset) => {
      if (throwOnFail && asset.status === AssetStatus.FAILED) {
        throw asset.error;
      }
      return from(asset.commit());
    }

    await new Promise<void>((resolve, reject) => {
      task.fn(input)
        .pipe(
          map(onAsset),
          mergeAll()
        )
        .subscribe({
          next: asset => this.onBuilt(task.name, asset),
          error: error => reject(error),
          complete: async () => {
            await setImmediatePromise();
            resolve();
          }
        });
      input.connect();
    });
  }

  private queueEvents(task: NamedTask, events: InputEvent[]) {
    return this.queue.add(() => this.buildEvents(task, events, false));
  }

  private async getInputEvents(task: string, entries: string[]): Promise<InputEvent[]> {
    if (this.options.disableCache) {
      return entries.map(entry => new InitialEvent({
        cacheDir: this.options.cacheDir,
        cacheKey: this.cache.getHashForEntry(entry),
        entry,
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

    await this.buildEvents(task, events, true);
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

    await this.queueEvents(task, events);
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
