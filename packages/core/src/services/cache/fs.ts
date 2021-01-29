import path from 'path';
import watcher from '@parcel/watcher';
import { inject } from '@loopback/context';

import {
  IFSCache
} from '../../interfaces';
import {
  CacheBindings,
  CoreBindings,
  RequestBindings
} from '../../keys';
import {
  DirectoryPath,
  FilePath
} from '../../types';

const FILENAME = 'fs.txt';

export class FSCache implements IFSCache {
  private filePath: FilePath;

  constructor(
    @inject(CoreBindings.CACHE_DIR) private cacheDir: DirectoryPath,
    @inject(CacheBindings.REQUEST_CACHE_DIR) private requestCacheDir: DirectoryPath,
    @inject(RequestBindings.ENTRY) private entry: DirectoryPath,
  ) {
    this.filePath = path.join(
      this.requestCacheDir,
      FILENAME
    );
  }

  public async getEventsSince(): Promise<watcher.Event[]> {
    return await watcher.getEventsSince(
      this.entry,
      this.filePath,
      { ignore: [this.cacheDir] }
    )
  }

  public async batchUpdate() {
    await watcher.writeSnapshot(
      this.entry,
      this.filePath,
      {
        ignore: [this.cacheDir]
      }
    )
  }
}
