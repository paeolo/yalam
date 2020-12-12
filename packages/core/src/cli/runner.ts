import {
  attach,
  add
} from 'exits';
import {
  Yalam,
  YalamOptions
} from '../core';
import { TaskLoader } from './task-loader';

export const enum RunnerMode {
  BUILD,
  WATCH
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
  }

  public async run() {
    this.taskLoader.load();

    switch (this.options.mode) {
      case RunnerMode.BUILD:
        await this.yalam.build({
          entries: this.options.entries,
          task: this.options.task || DEFAULT_TASK
        });
        break;
      case RunnerMode.WATCH:
        attach();
        const subscription = await this.yalam.watch({
          entries: this.options.entries,
          task: this.options.task || DEFAULT_TASK
        });
        add(subscription.unsubscribe);
        break;
    }
  }
}
