import { attach, add } from 'exits';
import Glupi, { GlupiOptions } from './glupi';

export const enum RunnerMode {
  BUILD,
  WATCH
};

export interface RunnerOptions {
  mode: RunnerMode;
  glupiOptions: GlupiOptions;
}

export class Runner {
  private options: RunnerOptions;
  private glupi: Glupi;

  constructor(options: RunnerOptions) {
    this.options = options;
    this.glupi = new Glupi(options.glupiOptions)
  }

  public async run() {
    switch (this.options.mode) {
      case RunnerMode.BUILD:
        await this.glupi.build();
        break;
      case RunnerMode.WATCH:
        attach();
        const subscription = await this.glupi.watch();
        add(subscription.unsubscribe);
        break;
    }
  }
}
