import watcher from '@parcel/watcher';
import EventEmitter from 'eventemitter3';
import PQueue from 'p-queue';
import setImmediatePromise from 'set-immediate-promise';
import { from } from 'rxjs';

import Cache from './cache';
import {
  AsyncSubscription,
  Event,
  EventType,
  FileEvent,
  InitialEvent,
  Reporter,
  Task
} from './types';
import {
  normalizeEntries,
  normalizeOptions,
  unsubscribeAll
} from './utils';
import {
  Asset,
  AssetType
} from './asset';

export interface YalamOptions {
  disableCache?: boolean;
  cacheDir?: string;
}

interface BuildOptions {
  task: string;
  entries: string[];
}

interface EventTypes {
  idle: () => void;
  added: (events: Event[]) => void;
  built: (asset: Asset) => void;
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
    this.ignoredFiles = new Set();
    this.queue = new PQueue()
      .on('idle', () => this.emit('idle'));
  }

  private get(key: string) {
    const task = this.tasks.get(key);
    if (!task) {
      throw new Error(`Task not found: ${key}`)
    }
    return task;
  }

  private async handle(asset: Asset) {
    this.ignoredFiles.add(asset.getFullPath());
    this.emit('built', asset);
    switch (asset.type) {
      case AssetType.ARTIFACT:
        await asset.writeFile();
        break;
      case AssetType.DELETED:
        await asset.deleteFile();
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
          ? EventType.DELETE
          : EventType.UPDATE,
        entry,
        path: event.path
      }))
  }

  private async getInitialEvents(entries: string[]): Promise<InitialEvent[]> {
    return entries.map(entry => ({
      type: EventType.INITIAL,
      path: entry
    }));
  }

  private buildFromEvents(task: Task, events: Event[]) {
    return this.queue.add(() => {
      this.emit('added', events);
      return task(from(events)).forEach(this.handle.bind(this));
    });
  }

  /**
  * @description
  * Add a build task with the provided key.
  */
  public addTask(key: string, task: Task) {
    this.tasks.set(key, task);
    return this;
  }

  /**
  * @description
  * Register a reporter to report progress.
  */
  public addReporter(reporter: Reporter) {
    this.addListener('added', reporter.onAdded.bind(reporter));
    this.addListener('built', reporter.onBuilt.bind(reporter));
    this.addListener('idle', reporter.onIdle.bind(reporter));
    return this;
  }

  /**
   * @description
   * Returns a promise resolved when the build succeed.
   */
  public async build(options: BuildOptions) {
    const entries = await normalizeEntries(options.entries);
    const task = this.get(options.task);
    const events = await this.getInitialEvents(entries);
    await this.buildFromEvents(task, events);
  }

  /**
   * @description
   * Returns a promise resolved when the first build succeed
   * and watching started.
   */
  public async watch(options: BuildOptions): Promise<AsyncSubscription> {
    const entries = await normalizeEntries(options.entries);
    const task = this.get(options.task);
    const events = await this.getInitialEvents(entries);

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
