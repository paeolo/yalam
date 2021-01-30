import {
  attach,
  add,
} from 'exits';
import {
  Yalam,
  YalamOptions
} from '@yalam/core';

import {
  initTTY,
  getTask
} from './utils';

export const enum RunnerMode {
  BUILD = 'build',
  WATCH = 'watch',
};

export interface RunnerOptions {
  mode: RunnerMode;
  entries: string[];
  options: YalamOptions;
};

export class Runner {
  private options: RunnerOptions;
  private yalam: Yalam;

  constructor(options: RunnerOptions) {
    this.options = options;
    this.yalam = new Yalam(options.options);
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
    const promises = this.options.entries
      .map(
        entry => this.yalam.build({
          task: getTask(entry, RunnerMode.BUILD),
          entry,
        })
      );

    await Promise.all(promises);
  }

  private async watch() {
    attach();

    if (process.stdin.isTTY) {
      initTTY();
    }

    const promises = this.options.entries
      .map(
        entry => this.yalam.watch({
          task: getTask(entry, RunnerMode.WATCH),
          entry,
        })
      );

    const subscriptions = await Promise.all(promises);

    subscriptions.forEach(
      (subscription) => add(subscription.unsubscribe)
    );
  }
}
