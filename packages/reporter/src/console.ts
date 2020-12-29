import {
  Asset,
  AssetStatus,
  InputEvent,
  Reporter,
  BuildError
} from '@yalam/core';
import chalk from 'chalk';
import dateFormat from 'dateformat';

export const enum LogLevel {
  INFO = 'Info',
  ERROR = 'Error',
  SUCCESS = 'Success'
}

export class ConsoleLogger {
  private getDate() {
    return dateFormat(new Date(), 'hh:MM:ss');
  }

  private print(prefix: string, message: string) {
    console.log(
      `${prefix} ${chalk.gray(this.getDate())} ${message}`
    );
  }

  public info(message: string) {
    this.print(chalk.blue(LogLevel.INFO.concat(':')), message);
  }

  public error(message: string) {
    this.print(chalk.red(LogLevel.ERROR.concat(':')), message);
  }

  public success(message: string) {
    this.print(chalk.green(LogLevel.SUCCESS.concat(':')), message);
  }
}

export class ConsoleReporter implements Reporter {
  private startTime = 0;
  private processing = false;
  private logger = new ConsoleLogger();

  public onInput(event: InputEvent) {
    if (!this.processing) {
      this.startTime = new Date().getTime();
      this.processing = true;
    }
  }

  public onBuilt(asset: Asset) {
    if (asset.status === AssetStatus.ARTIFACT) {
      this.logger.info(`Built ${asset.path}`)
    }
  }

  public onIdle(events?: BuildError[]) {
    if (events && events.length !== 0) {
      events.forEach(
        (event) => this.logger.error(event.error.toString())
      );
    } else {
      this.logger.success(`Built in ${new Date().getTime() - this.startTime}ms`);
    }
    this.processing = false;
  }
}
