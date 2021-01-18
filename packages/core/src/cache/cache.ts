import mkdirp from 'mkdirp';
import path from 'path';

import {
  DirectoryPath,
  EventType,
  InputEvent,
  Reporter,
} from '../types';
import {
  DeletedAsset,
  ErrorAsset,
  FileAsset
} from '../asset';
import {
  CacheMeta,
  FileEvent,
  InitialEvent
} from '../events'
import {
  AssetService,
  ErrorService,
  FSService,
  HashService
} from './services';
import {
  CACHE_NAME
} from '../constants';

const version = require('../../package.json').version;

export interface CacheOptions {
  cacheDir: string;
  cacheKey: string;
}

export class Cache implements Reporter {
  private cacheDir: DirectoryPath;
  private cacheKey: string;
  private hashes: HashService;
  private assets: AssetService;
  private errors: ErrorService;
  private fs: FSService;
  private entries: Set<DirectoryPath>;

  constructor(options: CacheOptions) {
    this.cacheDir = options.cacheDir;
    this.cacheKey = options.cacheKey;
    this.hashes = new HashService({
      cacheKey: this.cacheKey,
      version
    });
    this.assets = new AssetService({
      cacheDir: this.cacheDir,
      hashes: this.hashes
    });
    this.errors = new ErrorService({
      cacheDir: this.cacheDir,
      hashes: this.hashes
    });
    this.fs = new FSService({
      cacheDir: this.cacheDir,
      hashes: this.hashes
    });
    this.entries = new Set();
    mkdirp.sync(
      path.join(options.cacheDir, CACHE_NAME)
    );
  }

  public getCacheMeta(entry: DirectoryPath): CacheMeta {
    return {
      directory: this.cacheDir,
      key: this.hashes.getHashForEntry(entry)
    }
  }

  private async getInitialEvents(task: string, entries: DirectoryPath[],): Promise<InputEvent[]> {
    const fileEvents = await this.fs.getEventsSince(entries);

    const deletedEvents: InputEvent[] = fileEvents
      .filter((value) => value.event.type === 'delete')
      .map((value) => new FileEvent({
        type: EventType.DELETED,
        entry: value.entry,
        cache: this.getCacheMeta(value.entry),
        path: value.event.path,
      }));

    const initialEvents = entries.map(entry => new InitialEvent({
      cache: this.getCacheMeta(entry),
      entry,
    }));

    return deletedEvents.concat(initialEvents);
  }

  public async getInputEvents(task: string, entries: DirectoryPath[], disableCache: boolean): Promise<InputEvent[]> {
    await this.assets.sync(entries);

    if (disableCache) {
      return this.getInitialEvents(task, entries)
    }

    const [
      errorEvents,
      fileEvents,
    ] = await Promise.all([
      this.errors.getEvents(task, entries),
      this.fs.getEventsSince(entries),
    ]);

    let events = fileEvents.map((value) => {
      return new FileEvent({
        type: value.event.type === 'delete'
          ? EventType.DELETED
          : EventType.UPDATED,
        entry: value.entry,
        cache: this.getCacheMeta(value.entry),
        path: value.event.path,
      })
    });

    errorEvents.forEach((item) => {
      if (!events.some(
        (value) => value.entry === item.entry && value.path === item.event.path)
      ) {
        events.push(new FileEvent({
          type: EventType.UPDATED,
          entry: item.entry,
          path: item.event.path,
          cache: this.getCacheMeta(item.entry),
        }));
      }
    });

    return events;
  }

  public onInput(task: string, events: InputEvent[]) {
    events.forEach((event) => {
      this.entries.add(event.entry);
    });
    this.errors.onInput(task, events);
  }

  public onBuilt(task: string, asset: FileAsset) {
    this.assets.onBuilt(task, asset);
  }

  public onError(task: string, error: ErrorAsset) {
    this.errors.onError(task, error);
  }

  public onDeleted(task: string, asset: DeletedAsset) {
    this.assets.onDeleted(task, asset);
  }

  public async onIdle(errors: ErrorAsset[]) {
    const entries = Array.from(this.entries);

    await Promise.all([
      this.assets.update(),
      this.errors.update(),
      this.fs.writeSnapshot(entries)
    ]);

    this.entries.clear();
  }
}
