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
  constructor(
    @inject(CoreBindings.CACHE_DIR) private cacheDir: DirectoryPath,
    @inject(CacheBindings.REQUEST_CACHE_DIR) private requestCacheDir: DirectoryPath,
    @inject(CacheBindings.FS_CACHE) private fs: IFSCache,
    @inject(CacheBindings.ASSET_CACHE) private assets: IAssetCache,
    @inject(CacheBindings.ERROR_CACHE) private errors: IErrorCache,
    @inject(RequestBindings.ENTRY) private entry: DirectoryPath,
    @inject(RequestBindings.CACHE_KEY) private cacheKey: string,
  ) {
    mkdirp.sync(this.requestCacheDir);
  }

  public async getInputEvents(): Promise<InputEvent[]> {
    const hasSync = await this.assets.sync();

    if (!hasSync) {
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

    return [];
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

  public async batchUpdate() {
    const lockFilePath = path.join(
      this.requestCacheDir,
      LOCKFILE
    );
    await lockFileAsync(lockFilePath);

    await Promise.all([
      this.fs.batchUpdate(),
      this.assets.batchUpdate(),
      this.errors.batchUpdate()
    ]);

    await unlockFileAsync(lockFilePath);
  }
}
