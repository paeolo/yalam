import {
  attach,
  add
} from 'exits';
import {
  Yalam,
  YalamOptions
} from '@yalam/core';
import Reporter from '@yalam/reporter';

import { TaskLoader } from './task-loader';

export const enum RunnerMode {
  BUILD,
  WATCH,
  SHOW,
};

export interface RunnerOptions {
  mode: RunnerMode;
  entries: string[];
  configPath?: string;
  task?: string;
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
      configPath: options.configPath
    });
    new Reporter(this.yalam);
  }

  public async run() {
    switch (this.options.mode) {
      case RunnerMode.BUILD:
        await this.taskLoader.load();
        await this.yalam.build({
          entries: this.options.entries,
          task: this.options.task || DEFAULT_TASK
        });
        break;
      case RunnerMode.WATCH:
        await this.taskLoader.load();
        attach();
        const subscription = await this.yalam.watch({
          entries: this.options.entries,
          task: this.options.task || DEFAULT_TASK
        });
        add(subscription.unsubscribe);
        break;
      case RunnerMode.SHOW:
        await this.taskLoader.show();
        break;
    }
  }
}
