import {
  attach,
  add,
} from 'exits';
import {
  Yalam,
  YalamOptions
} from '@yalam/core';

import { initTTY } from './utils';
import { TaskLoader } from './task-loader';

export const enum RunnerMode {
  BUILD,
  WATCH,
};

export interface RunnerOptions {
  mode: RunnerMode;
  entries: string[];
  configPath: string;
  taskName?: string;
  yalamOptions: YalamOptions;
};

const DEFAULT_TASK = 'default';

export class Runner {
  private options: RunnerOptions;
  private yalam: Yalam;
  private taskLoader: TaskLoader;

  constructor(options: RunnerOptions) {
    this.options = options;
    this.yalam = new Yalam(options.yalamOptions);
    this.taskLoader = new TaskLoader({
      yalam: this.yalam,
      configPath: options.configPath,
    });
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
    await this.taskLoader.load();
    await this.yalam.build({
      entries: this.options.entries,
      taskName: this.options.taskName || DEFAULT_TASK
    });
  }

  private async watch() {
    await this.taskLoader.load();
    attach();
    if (process.stdin.isTTY) {
      initTTY();
    }
    const subscription = await this.yalam.watch({
      entries: this.options.entries,
      taskName: this.options.taskName || DEFAULT_TASK
    });
    add(subscription.unsubscribe);
  }
}
