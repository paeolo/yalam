import {
  attach,
  add
} from 'exits';
import {
  Yalam,
  YalamOptions
} from '../core';

export const enum RunnerMode {
  BUILD,
  WATCH
};

export interface RunnerOptions {
  mode: RunnerMode;
  entries: string[];
  task?: string;
  yalamOptions: YalamOptions;
};

const DEFAULT_TASK = 'default';

export class Runner {
  private options: RunnerOptions;
  private yalam: Yalam;

  constructor(options: RunnerOptions) {
    this.options = options;
    this.yalam = new Yalam(options.yalamOptions)
  }

  public async run() {

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
