#!/usr/bin/env node
require('v8-compile-cache');

import meow from 'meow';
import { ConsoleReporter } from '@yalam/reporter';

import { run } from '.';

const cli = meow(`
  Usage
    $ yalam --option <entries> ...

  List of options
    - config |> Specify a custom path to config file
    - watch |> Build your changes while your are coding
    - no-cache |> Disable any caching features
    - pipeline |> Force a specific pipeline use
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
    pipeline: {
      type: 'string',
      alias: 'p'
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
    reporter.getLogger().error(err.message)
    process.exit(1);
  });
