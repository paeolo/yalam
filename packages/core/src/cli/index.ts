import { FlagsType } from './bin';
import {
  Runner,
  RunnerMode
} from './runner';

export const run = async (entries: string[], flags: FlagsType) => {
  const mode = flags.watch
    ? RunnerMode.WATCH
    : RunnerMode.BUILD;

  const runner = new Runner({
    mode,
    entries,
    task: flags.task,
    configPath: flags.config,
    yalamOptions: {
      disableCache: flags.cache === false,
    }
  });

  await runner.run();
}
