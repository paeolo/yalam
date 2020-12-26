import {
  Asset,
  Event,
  Reporter
} from '@yalam/core';
import ora from 'ora';
import readline from 'readline';

const supportsEmoji =
  process.platform !== 'win32' || process.env.TERM === 'xterm-256color';

const SUCCESS: string = supportsEmoji ? '✨' : '√';
const ERROR: string = supportsEmoji ? '🚨' : '×';

export class ConsoleReporter implements Reporter {
  private spinner = ora();
  private startTime = 0;
  private shouldClear = false;

  public onAdded(events: Event[]) {
    if (!this.spinner.isSpinning) {
      this.startTime = new Date().getTime();
      if (this.shouldClear) {
        readline.moveCursor(process.stdout, 0, -1);
        readline.clearScreenDown(process.stdout);
      }
      this.spinner.start();
      this.shouldClear = true;
    }
  }

  public onBuilt(asset: Asset) {
  }

  public onError() {
    this.spinner.stopAndPersist(
      {
        symbol: ERROR,
        text: `Build failed`
      }
    );
  }

  public onIdle() {
    this.spinner.stopAndPersist(
      {
        symbol: SUCCESS,
        text: `Built in ${new Date().getTime() - this.startTime}ms`
      }
    );
  }
}
