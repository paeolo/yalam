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
  IgnorerService,
  ErrorService
} from './services';
import {
  FileEvent,
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
  ErrorAsset,
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
  input: (task: string, events: InputEvent[]) => void;
  built: (task: string, asset: FileAsset) => void;
  error: (task: string, error: ErrorAsset) => void;
  deleted: (task: string, asset: DeletedAsset) => void;
  idle: (errors: ErrorAsset[]) => void;
}

interface NamedTask {
  name: string;
  fn: Task;
}

export class Yalam extends EventEmitter<EventTypes> {
  private options: Required<YalamOptions>;
  private cache: Cache;
  private ignorer: IgnorerService;
  private errors: ErrorService;
  private tasks: Map<string, Task>;
  private queue: PQueue;

  constructor(options: YalamOptions = {}) {
    super();
    this.tasks = new Map();
    this.options = normalizeOptions(options);
    this.cache = new Cache({
      cacheDir: this.options.cacheDir,
      cacheKey: this.options.cacheKey
    });
    this.queue = new PQueue({
      concurrency: this.options.concurrency
    });
    this.ignorer = new IgnorerService();
    this.errors = new ErrorService();
    this.init(this.options.reporters);
  }

  private init(reporters: Reporter[]) {
    reporters.forEach(
      (reporter) => this.bindReporter(reporter)
    );
    this.bindReporter(this.cache);
    this.bindReporter(this.errors);
    this.bindReporter(this.ignorer);
    this.queue.on('idle', () => this.onIdle());
  }

  private onIdle() {
    this.errors.update();
    this.emit('idle', this.errors.getErrors());
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
    if (reporter.onError) {
      this.addListener(
        'error',
        reporter.onError.bind(reporter)
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
      case AssetStatus.ERROR:
        this.emit('error', task, asset);
        break;
      case AssetStatus.ARTIFACT:
        this.emit('built', task, asset);
        break;
      case AssetStatus.DELETED:
        this.emit('deleted', task, asset);
        break;
    }
  }

  private getSubscription(task: NamedTask, entry: DirectoryPath) {
    const onEvents = async (err: Error | null, events: watcher.Event[]) => {
      if (err) {
        throw err;
      }
      const input = events
        .filter(this.ignorer.getEventFilter(entry));

      if (input.length === 0) {
        return;
      }

      await setImmediatePromise();
      this.queueEvents(
        task,
        this.getFileEvents(task.name, entry, input),
        false
      );
    };

    return watcher.subscribe(
      entry,
      onEvents,
      { ignore: [this.options.cacheDir] }
    );
  }

  private getFileEvents(task: string, entry: DirectoryPath, events: watcher.Event[]): FileEvent[] {
    return events
      .map((event) => new FileEvent({
        type: event.type === 'delete'
          ? EventType.DELETED
          : EventType.UPDATED,
        cache: this.cache.getCacheMeta(task, entry),
        entry,
        path: event.path,
      }));
  }

  private queueEvents(task: NamedTask, events: InputEvent[], throwOnFail: boolean) {
    this.emit('input', task.name, events);

    return this.queue.add(async () => {
      const input = publish<InputEvent>()(from(events));

      const onAsset = (asset: Asset) => {
        if (throwOnFail && asset.status === AssetStatus.ERROR) {
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
    });
  }

  private async getInputEvents(task: string, entries: DirectoryPath[]): Promise<InputEvent[]> {
    return this.cache.getInputEvents(
      task,
      entries,
      this.options.disableCache
    );
  }

  /**
  * @description
  * Add a build task with the provided name to the tasks.
  */
  public addTask(key: string, fn: Task) {
    this.tasks.set(key, fn);
    return this;
  }

  /**
   * @description
   * Resolved when the build succeed.
   */
  public async build(options: BuildOptions) {
    const entries = await normalizeEntries(options.entries);
    const task = this.getNamedTask(options.task);
    const events = await this.getInputEvents(options.task, entries);

    await this.queueEvents(task, events, true);
  }

  /**
   * @description
   * Resolved with a subscription when the first build succeed and file are watched.
   */
  public async watch(options: BuildOptions): Promise<AsyncSubscription> {
    const entries = await normalizeEntries(options.entries);
    const task = this.getNamedTask(options.task);

    const events = await this.getInputEvents(
      options.task,
      entries
    );

    await this.queueEvents(task, events, false);
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
