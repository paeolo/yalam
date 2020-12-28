import {
  Asset,
  AssetStatus,
  Event,
  Reporter,
  ErrorEvent
} from '@yalam/core';
import chalk from 'chalk';
import dateFormat from 'dateformat';

export class ConsoleReporter implements Reporter {
  private startTime = 0;
  private processing = false;

  private logInfo(message: string) {
    const date = dateFormat(new Date(), 'hh:MM:ss');
    console.log(`${chalk.blue('Info:')} ${chalk.gray(date)} ${message}`);
  }

  private logError(message: string) {
    const date = dateFormat(new Date(), 'hh:MM:ss');
    console.log(`${chalk.red('Error:')} ${chalk.gray(date)} ${message}`);
  }

  private logSuccess(message: string) {
    const date = dateFormat(new Date(), 'hh:MM:ss');
    console.log(`${chalk.green('Success:')} ${chalk.gray(date)} ${message}`);
  }

  public onInput(events: Event[]) {
    if (!this.processing) {
      this.startTime = new Date().getTime();
      this.processing = true;
    }
  }

  public onBuilt(asset: Asset) {
    if (asset.status === AssetStatus.ARTIFACT) {
      this.logInfo(`Built ${asset.path}`)
    }
  }

  public onError(event: ErrorEvent) {
    this.logError(event.error.toString());
  }

  public onIdle() {
    this.logSuccess(`Built in ${new Date().getTime() - this.startTime}ms`);
    this.processing = false;
  }
}
