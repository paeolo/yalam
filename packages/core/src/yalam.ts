import watcher from '@parcel/watcher';
import EventEmitter from 'eventemitter3';
import PQueue from 'p-queue';
import setImmediatePromise from 'set-immediate-promise';
import {
  from
} from 'rxjs';
import {
  map,
  mergeAll
} from 'rxjs/operators';

import Cache from './cache';
import {
  AsyncSubscription,
  Event,
  EventType,
  ErrorEvent,
  FileEvent,
  InitialEvent,
  Reporter,
  Task,
} from './types';
import {
  normalizeEntries,
  normalizeOptions,
  unsubscribeAll,
} from './utils';
import {
  Asset,
  AssetStatus
} from './asset';

export interface YalamOptions {
  disableCache?: boolean;
  cacheDir?: string;
  cacheKey?: string;
  reporters?: Reporter[];
}

interface BuildOptions {
  task: string;
  entries: string[];
}

interface EventTypes {
  input: (events: Event[]) => void;
  built: (asset: Asset) => void;
  error: (event: ErrorEvent) => void;
  idle: () => void;
}

export class Yalam extends EventEmitter<EventTypes> {
  private options: Required<YalamOptions>;
  private cache: Cache;
  private tasks: Map<string, Task>;
  private ignoredFiles: Set<string>;
  private queue: PQueue;

  constructor(options: YalamOptions = {}) {
    super();

    this.options = normalizeOptions(options);
    this.cache = new Cache(this.options.cacheDir);
    this.tasks = new Map();
    this.queue = new PQueue();
    this.ignoredFiles = new Set();

    this.init(this.options.reporters);
  }

  private init(reporters: Reporter[]) {
    reporters.forEach(
      (reporter) => this.bindReporter(reporter)
    );
    this.queue.on('idle', () => this.emit('idle'));
  }

  private bindReporter(reporter: Reporter) {
    this.addListener('input', reporter.onInput.bind(reporter));
    this.addListener('built', reporter.onBuilt.bind(reporter));
    this.addListener('error', reporter.onError.bind(reporter));
    this.addListener('idle', reporter.onIdle.bind(reporter));
  }

  private get(key: string) {
    const task = this.tasks.get(key);
    if (!task) {
      throw new Error(`Task not found: ${key}`)
    }
    return task;
  }

  private async handle(asset: Asset) {
    switch (asset.status) {
      case AssetStatus.ARTIFACT:
        this.ignoredFiles.add(asset.getFullPath());
        await asset.writeFile();
        break;
      case AssetStatus.DELETED:
        await asset.deleteFile();
        break;
    }
    return asset;
  }

  private emitResult(asset: Asset) {
    switch (asset.status) {
      case AssetStatus.ARTIFACT:
        this.emit('built', asset);
        break;
      case AssetStatus.FAILED:
        this.emit('error', {
          error: asset.getError() || new Error(),
          event: asset.getEvent()
        });
        break;
    }
  }

  private getSubscription(task: Task, entry: string) {
    return watcher.subscribe(entry, async (err, events) => {
      if (err) {
        throw err;
      }
      const fileEvents = this.getFileEvents(entry, events);
      await setImmediatePromise();

      if (fileEvents.length !== 0) {
        await this.buildFromEvents(task, fileEvents);
      }
    });
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

  private async getEvents(entries: string[]): Promise<InitialEvent[]> {
    return entries.map(entry => ({
      type: EventType.INITIAL,
      path: entry
    }));
  }

  private async buildFromEvents(task: Task, events: Event[]) {
    return this.queue.add(async () => {
      this.emit('input', events);
      await task(from(events))
        .pipe(
          map(asset => from(this.handle(asset))),
          mergeAll()
        )
        .forEach((asset) => this.emitResult(asset))
    });
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
    const task = this.get(options.task);
    const events = await this.getEvents(entries);
    await this.buildFromEvents(task, events);
  }

  /**
   * @description
   * Returns a promise resolved when the first build succeed and file are watched.
   */
  public async watch(options: BuildOptions): Promise<AsyncSubscription> {
    const entries = await normalizeEntries(options.entries);
    const task = this.get(options.task);
    const events = await this.getEvents(entries);

    await this.buildFromEvents(task, events);

    const subscriptions = await Promise.all(
      entries.map(entry => this.getSubscription(task, entry))
    );

    return {
      unsubscribe: async () => {
        await unsubscribeAll(subscriptions);
        await this.queue.onIdle();
      }
    }
  }
}
