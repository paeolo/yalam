import watcher from '@parcel/watcher';
import {
  from,
  Subject
} from 'rxjs';

import Cache from './cache';
import {
  AsyncSubscription,
  Event,
  EventType,
  InitialEvent,
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
import {
  TASK_NOT_FOUND
} from '../errors';

export interface YalamOptions {
  disableCache?: boolean;
  cacheDir?: string;
}

interface BuildOptions {
  task: string;
  entries: string[];
}

export class Yalam {
  private options: Required<YalamOptions>;
  private cache: Cache;
  private tasks: Map<string, Task>;

  constructor(options: YalamOptions = {}) {
    this.options = normalizeOptions(options);
    this.cache = new Cache(this.options.cacheDir);
    this.tasks = new Map();
  }

  public add(key: string, task: Task) {
    this.tasks.set(key, task);
  }

  private get(key: string) {
    const task = this.tasks.get(key);
    if (!task) {
      throw TASK_NOT_FOUND(key);
    }
    return task;
  }

  private async handle(asset: Asset) {
    switch (asset.type) {
      case AssetType.ARCTIFACT:
        await asset.writeFile();
        break;
      case AssetType.DELETED:
        await asset.deleteFile();
        break;
    }
  }

  private getSubscription(subject: Subject<Event>, entry: string) {
    return watcher.subscribe(entry, (err, events) => {
      if (err) {
        subject.error(err);
      }
      events.forEach((event) => {
        subject.next({
          type: event.type === 'delete'
            ? EventType.DELETE
            : EventType.UPDATE,
          entry,
          path: event.path
        });
      })
    });
  }

  /**
   * @description
   * Returns a promise resolved when the build succeed.
   */
  public async build(options: BuildOptions) {
    const entries = await normalizeEntries(options.entries);
    const task = this.get(options.task);

    const events: InitialEvent[] = entries.map(entry => ({
      type: EventType.INITIAL,
      path: entry
    }));

    await task(from(events)).forEach(this.handle.bind(this));
  }

  /**
   * @description
   * Returns a promise resolved when the first build succeed
   * and watching started.
   */
  public async watch(options: BuildOptions): Promise<AsyncSubscription> {
    const entries = await normalizeEntries(options.entries);
    const task = this.get(options.task);

    const events: InitialEvent[] = entries.map(entry => ({
      type: EventType.INITIAL,
      path: entry
    }));

    await task(from(events)).forEach(this.handle.bind(this));

    const input = new Subject<Event>();
    task(input).subscribe(this.handle.bind(this));

    const subscriptions = await Promise.all(
      entries.map(entry => this.getSubscription(input, entry))
    );

    return {
      unsubscribe: () => unsubscribeAll(subscriptions)
    }
  }
}
