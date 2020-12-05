#!/usr/bin/env node

import meow from 'meow';
import { runCLI } from '.';

const cli = meow(`
  Usage
    $ glupi --option <entries> ...

  List of options
    - watch |> Build your changes while your are coding
    - no-cache |> Disable any caching features
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
    }
  },
});

if (cli.input.length === 0)
  cli.showHelp(0);

export type FlagsType = typeof cli.flags;

runCLI(
  cli.input,
  cli.flags
);
