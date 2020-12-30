require('v8-compile-cache');

import { Reporter } from '@yalam/core';

import { FlagsType } from './bin';
import {
  Runner,
  RunnerMode
} from './runner';

export const run = async (entries: string[], flags: FlagsType, reporters: Reporter[]) => {
  let mode = RunnerMode.BUILD;

  if (flags.show) {
    mode = RunnerMode.SHOW;
  }
  else if (flags.watch) {
    mode = RunnerMode.WATCH;
  }

  const runner = new Runner({
    mode,
    entries,
    task: flags.task,
    configPath: flags.config,
    yalamOptions: {
      disableCache: flags.cache === false,
      reporters,
    }
  });
  await runner.run();
}
