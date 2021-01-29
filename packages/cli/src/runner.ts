import {
  attach,
  add,
} from 'exits';
import {
  Yalam,
  YalamOptions
} from '@yalam/core';

import { initTTY } from './utils';

export const enum RunnerMode {
  BUILD,
  WATCH,
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
          task: 'default',
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
          task: 'default',
          entry,
        })
      );

    const subscriptions = await Promise.all(promises);

    subscriptions.forEach(
      (subscription) => add(subscription.unsubscribe)
    );
  }
}
