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
  DirectoryPath
} from '../../types';

const FILENAME = 'fs.txt';

export class FSCache implements IFSCache {
  constructor(
    @inject(CoreBindings.CACHE_DIR) private cacheDir: DirectoryPath,
    @inject(CacheBindings.REQUEST_CACHE_DIR) private requestCacheDir: DirectoryPath,
    @inject(RequestBindings.ENTRY) private entry: DirectoryPath,
  ) { }

  public async getEventsSince(): Promise<watcher.Event[]> {
    return [];
  }

  public async batchUpdate() {
    const filePath = path.join(
      this.requestCacheDir,
      FILENAME
    );

    await watcher.writeSnapshot(
      this.entry,
      filePath,
      {
        ignore: [this.cacheDir]
      }
    )
  }
}
