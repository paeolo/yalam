import path from 'path';
import fs from 'fs/promises';
import { constants } from 'fs';
import { YalamOptions } from "./yalam";

const CACHE_DIR = '.yalam-cache';

export const normalizeOptions = (options: YalamOptions): Required<YalamOptions> => ({
  disableCache: options.disableCache || false,
  cacheDir: options.cacheDir || CACHE_DIR,
});

export const normalizeEntries = (entries: string[]) => {
  const promises = entries.map(
    async (entry) => {
      const directory = path.resolve(entry);

      try {
        await fs.access(directory, constants.F_OK);
      } catch {
        throw new Error(`Directory not found: ${entry}`);
      }

      const stats = await fs.lstat(directory);

      if (!stats.isDirectory())
        throw new Error(`Not a directory: ${entry}`);

      return directory;
    });

  return Promise.all(promises);
}
