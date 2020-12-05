require('v8-compile-cache');

import Glupi from './glupi';
import { FlagsType } from './cli';
import {
  Runner,
  RunnerMode
} from './runner';

export const runCLI = async (entries: string[], flags: FlagsType) => {
  const mode = flags.watch
    ? RunnerMode.WATCH
    : RunnerMode.BUILD;

  const runner = new Runner({
    mode,
    glupiOptions: {
      entries,
      disableCache: flags.cache === false,
    }
  });

  await runner.run();
}

export default Glupi;
