import watcher from '@parcel/watcher';
import { Subject } from 'rxjs';

import Cache from './cache';
import {
  AsyncSubscription,
  Event,
  EventType,
  Task
} from './types';
import {
  normalizeEntries,
  normalizeOptions
} from './utils';
import {
  TASK_NOT_FOUND
} from '../errors';
import { AssetType } from './asset';

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

  public async build(options: BuildOptions) {
  }

  public async watch(options: BuildOptions): Promise<AsyncSubscription> {
    const entries = await normalizeEntries(options.entries);
    const task = this.tasks.get(options.task);

    if (!task) {
      throw TASK_NOT_FOUND(options.task);
    }

    const subscriptions = await Promise.all(entries.map((entry) => {
      const input = new Subject<Event>();
      task(input).subscribe((asset) => {
        if (asset.write && asset.type === AssetType.ARCTIFACT) {
          asset.write();
        }
      });

      input.next({
        type: EventType.ENTRY,
        path: entry
      });

      return watcher.subscribe(entry, (err, events) => {
        if (err) {
          input.error(err);
        }
        events.forEach((event) => {
          input.next({
            type: event.type === 'delete'
              ? EventType.DELETE
              : EventType.UPDATE,
            path: event.path
          });
        })
      })
    }));

    return {
      unsubscribe: async () => {
        await Promise.all(
          subscriptions.map(value => value.unsubscribe())
        );
      }
    }
  }
}
