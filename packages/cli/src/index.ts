import path from 'path';
import md5File from 'md5-file';
import { Reporter } from '@yalam/core';

import { FlagsType } from './bin';
import {
  Runner,
  RunnerMode
} from './runner';
import {
  getConfig,
  getEntries
} from './utils';
import {
  YALAM_FILE
} from './constants';

export const run = async (entries: string[], flags: FlagsType, reporters: Reporter[]) => {
  const configPath = flags.config
    || path.join(process.cwd(), YALAM_FILE);

  const [
    config,
    cacheKey
  ] = await Promise.all([
    getConfig(configPath),
    md5File(configPath),
  ]);

  let mode = flags.watch
    ? RunnerMode.WATCH
    : RunnerMode.BUILD;

  const runner = new Runner({
    mode,
    config,
    entries: getEntries(entries),
    options: {
      disableCache: flags.cache === false,
      cacheKey,
      reporters,
    }
  });
  await runner.run();
}
