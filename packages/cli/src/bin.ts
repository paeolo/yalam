#!/usr/bin/env node

import meow from 'meow';
import { run } from '.';
import { ConsoleReporter } from '@yalam/reporter';

const cli = meow(`
  Usage
    $ yalam --option <entries> ...

  List of options
    - config |> Specify a custom path to config file
    - no-cache |> Disable any caching features
    - show |> List the tasks present in the config file
    - watch |> Build your changes while your are coding
`, {
  flags: {
    cache: {
      type: 'boolean',
      default: true
    },
    config: {
      type: 'string',
      alias: 'c'
    },
    task: {
      type: 'string',
      alias: 't',
    },
    watch: {
      type: 'boolean',
      alias: 'w',
    },
    show: {
      type: 'boolean',
      alias: 's',
      default: false
    }
  },
});

if (cli.input.length === 0 && !cli.flags.show)
  cli.showHelp(0);

export type FlagsType = typeof cli.flags;

const consoleReporter = new ConsoleReporter();

run(
  cli.input,
  cli.flags,
  [
    consoleReporter
  ]
)
  .catch((err: Error) => {
    consoleReporter.getLogger().error(err.toString())
    process.exit(1);
  });
