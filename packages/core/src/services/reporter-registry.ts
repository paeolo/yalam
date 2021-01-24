import PQueue from 'p-queue';
import EventEmitter from 'eventemitter3';
import { config, inject } from "@loopback/context";

import {
  CoreBindings
} from '../keys';
import {
  EventTypes,
  IReporterRegistry,
  Reporter
} from "../interfaces";
import {
  InputEvent
} from "../types";
import {
  DeletedAsset,
  ErrorAsset,
  FileAsset
} from "../assets";

export class ReporterRegistry extends EventEmitter<EventTypes> implements IReporterRegistry {
  constructor(
    @config() reporters: Reporter[],
    @inject(CoreBindings.QUEUE) queue: PQueue
  ) {
    super();
    queue.on('idle', () => this.emit('idle', []));
    reporters.forEach(
      (reporter) => this.bindReporter(reporter)
    );
  }

  private bindReporter(reporter: Reporter) {
    if (reporter.onInput) {
      this.addListener(
        'input',
        reporter.onInput.bind(reporter)
      );
    }
    if (reporter.onBuilt) {
      this.addListener(
        'built',
        reporter.onBuilt.bind(reporter)
      );
    }
    if (reporter.onDeleted) {
      this.addListener(
        'deleted',
        reporter.onDeleted.bind(reporter)
      );
    }
    if (reporter.onIdle) {
      this.addListener(
        'idle',
        reporter.onIdle.bind(reporter)
      );
    }
  }

  public onInput(task: string, events: InputEvent[]) {
    this.emit('input', task, events);
  }

  public onBuilt(task: string, asset: FileAsset) {
    this.emit('built', task, asset);
  }

  public onDeleted(task: string, asset: DeletedAsset) {
    this.emit('deleted', task, asset);
  }

  public onIdle(errors: ErrorAsset[]) {
    this.emit('idle', errors);
  }
}
