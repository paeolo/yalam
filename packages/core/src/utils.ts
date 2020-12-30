import path from 'path';
import fs from 'fs/promises';
import { constants } from 'fs';
import lockFile from 'lockfile';

import { YalamOptions } from "./yalam";
import { AsyncSubscription } from './types';
import {
  CACHE_DIR,
  CACHE_KEY
} from './constants';

export const unsubscribeAll = async (subscriptions: AsyncSubscription[]) => {
  await Promise.all(
    subscriptions.map(value => value.unsubscribe())
  );
}

export const normalizeOptions = (options: YalamOptions): Required<YalamOptions> => ({
  disableCache: options.disableCache || false,
  cacheDir: options.cacheDir || CACHE_DIR,
  cacheKey: options.cacheKey || CACHE_KEY,
  reporters: options.reporters || [],
  concurrency: options.concurrency || 50
});

export const existsOrFail = async (entry: string) => {
  const directory = path.resolve(entry);
  try {
    await fs.access(directory, constants.F_OK);
  } catch {
    throw new Error(`Directory not found: ${entry}`)
  }
}

const normalizeEntry = async (entry: string) => {
  await existsOrFail(entry);
  const directory = path.resolve(entry);
  const stats = await fs.lstat(directory);

  if (!stats.isDirectory()) {
    throw new Error(`Path is not a directory: ${entry}`)
  }

  return directory;
}

export const normalizeEntries = (entries: string[]) => {
  const promises = entries.map(normalizeEntry);
  return Promise.all(promises);
}

export const lockFileAsync = (filePath: string, options: { wait: number }) =>
  new Promise<void>((resolve, reject) => {
    const lockPath = filePath.concat('.lock');
    lockFile.lock(lockPath, options, (err) => {
      if (err) {
        reject(err);
      }
      else {
        resolve();
      }
    })
  })

export const unlockFileAsync = (filePath: string) =>
  new Promise<void>((resolve, reject) => {
    const lockPath = filePath.concat('.lock');
    lockFile.unlock(lockPath, (err) => {
      if (err) {
        reject(err);
      }
      else {
        resolve();
      }
    })
  })
