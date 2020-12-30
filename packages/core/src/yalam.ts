import watcher from '@parcel/watcher';
import EventEmitter from 'eventemitter3';
import PQueue from 'p-queue';
import PMap from 'p-map';
import setImmediatePromise from 'set-immediate-promise';
import {
  from,
  of
} from 'rxjs';
import {
  map,
  mergeAll
} from 'rxjs/operators';
import deepEqual from 'deep-equal';

import Cache from './cache';
import {
  AsyncSubscription,
  InputEvent,
  EventType,
  BuildError,
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
  Asset,
  AssetStatus
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
  built: (asset: Asset) => void;
  input: (event: InputEvent) => void;
  idle: (events?: BuildError[]) => void;
}

export class Yalam extends EventEmitter<EventTypes> {
  private options: Required<YalamOptions>;
  private cache: Cache;
  private tasks: Map<string, Task>;
  private ignoredFiles: Set<string>;
  private queue: PQueue;
  private errors: BuildError[];

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
    this.errors = [];

    this.init(this.options.reporters);
  }

  private init(reporters: Reporter[]) {
    reporters.forEach(
      (reporter) => this.bindReporter(reporter)
    );
    this.bindReporter(this.cache);
    this.queue.on('idle', () => this.emit('idle', this.errors));
  }

  private bindReporter(reporter: Reporter) {
    this.addListener('input', reporter.onInput.bind(reporter));
    this.addListener('built', reporter.onBuilt.bind(reporter));
    this.addListener('idle', reporter.onIdle.bind(reporter));
  }

  private get(key: string) {
    const task = this.tasks.get(key);
    if (!task) {
      throw new Error(`Task not found: ${key}`)
    }
    return task;
  }

  private onBuilt(asset: Asset, event: InputEvent) {
    if (asset.status === AssetStatus.SOURCE) {
      return;
    }

    this.errors = this.errors.filter(
      (value) => !(value.event.path === event.path)
    );
    this.ignoredFiles.add(asset.getFullPath());
    this.ignoredFiles.add(asset.getFullPath().concat('.map'));
    this.emit('built', asset);
  }

  private onError(error: Error, event: InputEvent) {
    if (event.type === EventType.UPDATED
      && !this.errors.some(value => deepEqual(value.event, event))) {
      this.errors.push({
        event,
        error
      });
    }
  }

  private getSubscription(task: Task, entry: string) {
    const onEvents = async (err: Error | null, events: watcher.Event[]) => {
      if (err) {
        throw err;
      }
      const fileEvents = this.getFileEvents(entry, events);
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
      .filter((event) => !this.ignoredFiles.has(event.path))
      .map((event) => ({
        type: event.type === 'delete'
          ? EventType.DELETED
          : EventType.UPDATED,
        entry,
        path: event.path
      }))
  }

  private async buildEvent(task: Task, event: InputEvent) {
    this.emit('input', event);
    await task(of(event))
      .pipe(
        map(asset => from(asset.commit())),
        mergeAll()
      )
      .forEach(
        (asset) => this.onBuilt(asset, event)
      );
  }

  private async buildEvents(task: Task, events: InputEvent[]) {
    const onEvent = (event: InputEvent) => this.buildEvent(task, event);
    await PMap(
      events,
      onEvent,
      { concurrency: this.options.concurrency, }
    );
  }

  private queueEvents(task: Task, events: InputEvent[]) {
    events.map(
      (event) => this.queue.add(() => this
        .buildEvent(task, event)
        .catch(error => this.onError(error, event))
      )
    );
  }

  private async getInputEvents(entries: string[]): Promise<InputEvent[]> {
    if (this.options.disableCache) {
      return entries.map(entry => ({
        type: EventType.INITIAL,
        path: entry
      }));
    }
    else {
      return this.cache.getInputEvents(entries);
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
    const task = this.get(options.task);
    const events = await this.getInputEvents(entries);

    await this.buildEvents(task, events);
    this.emit('idle');
  }

  /**
   * @description
   * Returns a promise resolved when the first build succeed and file are watched.
   */
  public async watch(options: BuildOptions): Promise<AsyncSubscription> {
    const entries = await normalizeEntries(options.entries);
    const task = this.get(options.task);
    const events = await this.getInputEvents(entries);

    await this.buildEvents(task, events);
    this.emit('idle');

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
