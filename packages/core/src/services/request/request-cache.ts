import path from 'path';
import mkdirp from 'mkdirp';
import watcher from '@parcel/watcher';
import { inject } from '@loopback/context';

import {
  lockFileAsync,
  unlockFileAsync
} from '../../utils';
import {
  DirectoryPath,
  FilePath,
  EventType,
  InputEvent
} from '../../types';
import {
  IAssetCache,
  IErrorCache,
  IFSCache,
  IRequestCache
} from "../../interfaces";
import {
  DeletedAsset,
  ErrorAsset,
  FileAsset
} from '../../assets';
import {
  CacheBindings,
  CoreBindings,
  RequestBindings,
} from '../../keys';
import {
  FileEvent, InitialEvent
} from '../../events';

const LOCKFILE = '.lock';

export class RequestCache implements IRequestCache {
  private lockFilePath: FilePath;

  constructor(
    @inject(CoreBindings.CACHE_DIR) private cacheDir: DirectoryPath,
    @inject(CoreBindings.DISABLE_CACHE) private disableCache: boolean,
    @inject(CacheBindings.REQUEST_CACHE_DIR) private requestCacheDir: DirectoryPath,
    @inject(CacheBindings.FS_CACHE) private fs: IFSCache,
    @inject(CacheBindings.ASSET_CACHE) private assets: IAssetCache,
    @inject(CacheBindings.ERROR_CACHE) private errors: IErrorCache,
    @inject(RequestBindings.ENTRY) private entry: DirectoryPath,
    @inject(RequestBindings.CACHE_KEY) private cacheKey: string,
  ) {
    this.lockFilePath = path.join(
      this.requestCacheDir,
      LOCKFILE
    );
    mkdirp.sync(this.requestCacheDir);
  }

  public convertEvent(event: watcher.Event): FileEvent {
    return new FileEvent({
      type: event.type === 'delete'
        ? EventType.DELETED
        : EventType.UPDATED,
      entry: this.entry,
      path: event.path,
      cache: {
        directory: this.cacheDir,
        key: this.cacheKey,
      },
    });
  }

  public async getInputEvents(): Promise<InputEvent[]> {
    const hasSync = await this.assets.sync();

    if (!hasSync || this.disableCache) {
      return [
        new InitialEvent({
          entry: this.entry,
          cache: {
            directory: this.cacheDir,
            key: this.cacheKey
          }
        })
      ];
    }

    const [
      errorEvents,
      fsEvents,
    ] = await Promise.all([
      this.errors.getEvents(),
      this.fs.getEventsSince(),
    ]);

    errorEvents.forEach(event => {
      if (!fsEvents.some(value => value.path === event.path)) {
        fsEvents.push(event);
      }
    });

    return fsEvents
      .map((event) => this.convertEvent(event));
  }

  public onInput(events: InputEvent[]) {
    this.errors.onInput(events);
  }

  public onBuilt(asset: FileAsset) {
    this.assets.onBuilt(asset);
  }

  public onError(error: ErrorAsset) {
    this.errors.onError(error);
  }

  public onDeleted(asset: DeletedAsset) {
    this.assets.onDeleted(asset);
  }

  public async batchUpdate() {
    await lockFileAsync(this.lockFilePath);

    await Promise.all([
      this.fs.batchUpdate(),
      this.assets.batchUpdate(),
      this.errors.batchUpdate()
    ]);

    await unlockFileAsync(this.lockFilePath);
  }
}
