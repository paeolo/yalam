require('v8-compile-cache');

import path from 'path';
import md5File from 'md5-file';
import { Reporter } from '@yalam/core';

import { FlagsType } from './bin';
import {
  Runner,
  RunnerMode
} from './runner';
import { YALAM_FILE } from './constants';
import { TaskLoader } from './task-loader';

export const run = async (entries: string[], flags: FlagsType, reporters: Reporter[]) => {
  const configPath = flags.config || path.join(process.cwd(), YALAM_FILE);

  if (flags.show) {
    TaskLoader.show(configPath);
    return;
  }

  const cacheKey = await md5File(configPath);
  let mode = flags.watch
    ? RunnerMode.WATCH
    : RunnerMode.BUILD;

  const runner = new Runner({
    mode,
    entries,
    taskName: flags.task,
    configPath,
    yalamOptions: {
      disableCache: flags.cache === false,
      cacheKey,
      reporters,
    }
  });
  await runner.run();
}
