import PQueue from 'p-queue';
import EventEmitter from 'eventemitter3';
import setImmediatePromise from 'set-immediate-promise';
import { config, inject } from "@loopback/context";

import {
  CoreBindings,
  RegistryBindings
} from '../../keys';
import {
  EventTypes,
  IErrorRegistry,
  IReporterRegistry,
} from "../../interfaces";
import {
  InputEvent,
  Reporter
} from "../../types";
import {
  DeletedAsset,
  FileAsset
} from "../../assets";

export class ReporterRegistry extends EventEmitter<EventTypes> implements IReporterRegistry {
  constructor(
    @config() reporters: Reporter[],
    @inject(CoreBindings.QUEUE) queue: PQueue,
    @inject(RegistryBindings.ERROR_REGISTRY) private errors: IErrorRegistry,
  ) {
    super();
    queue.on('idle', this.onIdle.bind(this));
    reporters.forEach(
      (reporter) => this.bindReporter(reporter)
    );
  }

  private async onIdle() {
    this.errors.batchUpdate();
    await setImmediatePromise();

    this.emit(
      'idle',
      this.errors.getErrors()
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
}
