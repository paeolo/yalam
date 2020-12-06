import path from 'path';
import fs from 'fs/promises';
import { YalamOptions } from "./yalam";

const CACHE_DIR = '.yalam-cache';

export const normalizeOptions = (options: YalamOptions): Required<YalamOptions> => ({
  disableCache: options.disableCache || false,
  cacheDir: options.cacheDir || CACHE_DIR,
});

export const normalizeEntries = (entries: string[]) => {
  const promises = entries.map(
    async (entry) => {
      const directory = path.resolve(entry)
      const stats = await fs.lstat(directory);

      if (!stats.isDirectory())
        throw new Error(`ERROR: ${entry} is not a directory`);

      return directory;
    });

  return Promise.all(promises);
}
