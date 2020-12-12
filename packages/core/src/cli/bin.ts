#!/usr/bin/env node

import chalk from 'chalk';
import meow from 'meow';
import { run } from '.';

const cli = meow(`
  Usage
    $ yalam --option <entries> ...

  List of options
    - watch |> Build your changes while your are coding
    - no-cache |> Disable any caching features
    - config |> Specify a custom path to config file
`, {
  flags: {
    watch: {
      type: 'boolean',
      alias: 'w',
    },
    cache: {
      type: 'boolean',
      alias: 'c',
      default: true
    },
    config: {
      type: 'string',
    },
    task: {
      type: 'string',
      alias: 't',
    }
  },
});

if (cli.input.length === 0)
  cli.showHelp(0);

export type FlagsType = typeof cli.flags;

run(cli.input, cli.flags)
  .catch((err: Error) => {
    console.error(chalk.yellow(err.message));
    process.exit(1);
  });
