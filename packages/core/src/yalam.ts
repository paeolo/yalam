import watcher from '@parcel/watcher';
import EventEmitter from 'eventemitter3';
import PQueue from 'p-queue';
import setImmediatePromise from 'set-immediate-promise';
import {
  from, of
} from 'rxjs';
import {
  map,
  mergeAll
} from 'rxjs/operators';
import deepEqual from 'deep-equal';

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
  input: (event: Event) => void;
  built: (asset: Asset) => void;
  idle: (events?: ErrorEvent[]) => void;
}

export class Yalam extends EventEmitter<EventTypes> {
  private options: Required<YalamOptions>;
  private cache: Cache;
  private tasks: Map<string, Task>;
  private ignoredFiles: Set<string>;
  private queue: PQueue;
  private errors: ErrorEvent[];

  constructor(options: YalamOptions = {}) {
    super();

    this.options = normalizeOptions(options);
    this.cache = new Cache(this.options.cacheDir);
    this.tasks = new Map();
    this.ignoredFiles = new Set();
    this.queue = new PQueue();
    this.errors = [];

    this.init(this.options.reporters);
  }

  private init(reporters: Reporter[]) {
    reporters.forEach(
      (reporter) => this.bindReporter(reporter)
    );
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

  private getSubscription(task: Task, entry: string) {
    return watcher.subscribe(entry, async (err, events) => {
      if (err) {
        throw err;
      }
      const fileEvents = this.getFileEvents(entry, events);
      await setImmediatePromise();
      this.queueEvents(task, fileEvents);
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

  private onBuilt(asset: Asset, event: Event) {
    if (asset.status === AssetStatus.ARTIFACT) {
      this.errors = this.errors.filter(value => !deepEqual(value.event, event));
      this.ignoredFiles.add(asset.getFullPath());
      this.emit('built', asset);
    }
  }

  private async buildEvent(task: Task, event: Event) {
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

  private buildEvents(task: Task, events: Event[]) {
    return Promise.all(
      events.map(
        (event) => this.buildEvent(task, event)
      )
    );
  }

  private queueEvents(task: Task, events: Event[]) {
    events.map(
      (event) => this.queue.add(() => this
        .buildEvent(task, event)
        .catch(error => {
          if (event.type === EventType.UPDATED
            && !this.errors.some(value => deepEqual(value.event, event))) {
            this.errors.push({
              event,
              error
            });
          }
        })
      )
    );
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
    const events = await this.getEvents(entries);

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
