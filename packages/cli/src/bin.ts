#!/usr/bin/env node

import meow from 'meow';
import { run } from '.';
import { ConsoleReporter } from '@yalam/reporter';

const cli = meow(`
  Usage
    $ yalam --option <entries> ...

  List of options
    - config |> Specify a custom path to config file
    - watch |> Build your changes while your are coding
    - no-cache |> Disable any caching features
`, {
  flags: {
    config: {
      type: 'string',
      alias: 'c'
    },
    watch: {
      type: 'boolean',
      alias: 'w',
    },
    cache: {
      type: 'boolean',
      default: true
    },
  },
});

if (cli.input.length === 0 && !cli.flags.show)
  cli.showHelp(0);

export type FlagsType = typeof cli.flags;

const reporter = new ConsoleReporter();

run(
  cli.input,
  cli.flags,
  [
    reporter
  ])
  .catch((err: Error) => {
    reporter.getLogger().error(err.toString())
    process.exit(1);
  });
