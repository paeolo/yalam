import {
  attach,
  add,
} from 'exits';
import {
  DirectoryPath,
  Yalam,
  YalamOptions
} from '@yalam/core';

import {
  initTTY,
} from './utils';

export const enum RunnerMode {
  BUILD = 'build',
  WATCH = 'watch',
};

export interface RunnerOptions {
  mode: RunnerMode;
  entries: DirectoryPath[],
  config: any,
  options: YalamOptions;
};

export class Runner {
  private options: RunnerOptions;
  private yalam: Yalam;

  constructor(options: RunnerOptions) {
    this.options = options;
    this.yalam = new Yalam(
      options.entries,
      options.config,
      options.options
    );
  }

  public async run() {
    switch (this.options.mode) {
      case RunnerMode.BUILD:
        await this.build();
        break;
      case RunnerMode.WATCH:
        await this.watch();
        break;
    }
  }

  private async build() {
    await this.yalam.build();
  }

  private async watch() {
    attach();

    if (process.stdin.isTTY) {
      initTTY();
    }

    const subscription = await this.yalam.watch();
    add(subscription.unsubscribe)
  }
}
