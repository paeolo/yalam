import { FlagsType } from './bin';
import {
  Runner,
  RunnerMode
} from './runner';

export const run = async (entries: string[], flags: FlagsType) => {
  let mode = RunnerMode.BUILD;

  if (flags.show)
    mode = RunnerMode.SHOW;
  else if (flags.watch)
    mode = RunnerMode.WATCH;

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
