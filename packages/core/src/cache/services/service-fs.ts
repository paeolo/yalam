import watcher from '@parcel/watcher';
import PMap from 'p-map';
import path from 'path';

import {
  DirectoryPath,
} from '../../types';
import {
  lockFileAsync,
  unlockFileAsync
} from '../../utils';
import { HashService } from './service-hash';
import { CACHE_NAME } from '../../constants';

export interface EventWithEntry {
  event: watcher.Event;
  entry: DirectoryPath;
}

const FILE_PREFIX = 'file_system';

interface FSServiceOptions {
  cacheDir: DirectoryPath;
  hashes: HashService;
}

export class FSService {
  private cacheDir: DirectoryPath;
  private hashes: HashService;

  constructor(options: FSServiceOptions) {
    this.cacheDir = options.cacheDir;
    this.hashes = options.hashes;
  }

  private getLockFilePath() {
    return path.join(
      this.cacheDir,
      CACHE_NAME,
      FILE_PREFIX.concat('.lock')
    );
  }

  private getCacheFilePath(entry: DirectoryPath) {
    const fileName = FILE_PREFIX.concat('.')
      .concat(this.hashes.getGenericHashForEntry(entry))
      .concat('.txt');

    return path.join(
      this.cacheDir,
      CACHE_NAME,
      fileName
    );
  }

  public async writeSnapshot(entries: DirectoryPath[]) {
    const lockFilePath = this.getLockFilePath();
    await lockFileAsync(lockFilePath);

    await Promise.all(
      entries.map((entry) => {
        watcher.writeSnapshot(
          entry,
          this.getCacheFilePath(entry),
          { ignore: [this.cacheDir] }
        )
      })
    );

    await unlockFileAsync(lockFilePath);
  }

  public async getEventsSince(entries: DirectoryPath[]) {
    const events: EventWithEntry[] = [];
    const lockFilePath = this.getLockFilePath();

    await lockFileAsync(lockFilePath);

    const addEvents = async (entry: DirectoryPath) => {
      const fileEvents = await watcher.getEventsSince(
        entry,
        this.getCacheFilePath(entry),
        { ignore: [this.cacheDir] }
      )
      events.push(
        ...fileEvents.map((event) => ({
          event,
          entry
        }))
      );
    };

    await PMap(entries, addEvents);
    await unlockFileAsync(lockFilePath);

    return events;
  }
}
