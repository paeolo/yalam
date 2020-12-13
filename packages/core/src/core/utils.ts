import path from 'path';
import fs from 'fs/promises';
import { constants } from 'fs';

import { YalamOptions } from "./yalam";
import { CACHE_DIR } from '../constants';
import {
  DIRECTORY_NOT_FOUND,
  PATH_NOT_DIRECTORY
} from '../errors';

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
        throw DIRECTORY_NOT_FOUND(entry);
      }

      const stats = await fs.lstat(directory);

      if (!stats.isDirectory())
        throw PATH_NOT_DIRECTORY(entry);

      return directory;
    });

  return Promise.all(promises);
}
