import path from 'path';
import assert from 'assert';
import fs from 'fs';
import { GlupiOptions } from "./glupi";

const CACHE_DIR = '.glupi-cache';

const getEntries = (entries: string[]) => entries.map(
  entry => {
    const result = path.resolve(entry);
    const stat = fs.lstatSync(result);
    assert(stat.isDirectory(), `${entry} should be a directory`);
    return result;
  }
);

export const normalizeOptions = (options: GlupiOptions): Required<GlupiOptions> => ({
  entries: getEntries(options.entries),
  disableCache: options.disableCache || false,
  cacheDir: options.cacheDir || CACHE_DIR,
});

export const getSnapshotPath = (cacheDir: string) => path.join(cacheDir, 'watcher-snapshot');
