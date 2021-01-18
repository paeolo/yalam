import { ErrorAsset } from '../asset';
import {
  Reporter,
  InputEvent,
  EventType
} from '../types';

interface ErrorWithTask {
  task: string;
  asset: ErrorAsset;
}

export class ErrorService implements Reporter {
  private eventsMap: Map<string, InputEvent[]>;
  private errorsMap: Map<string, ErrorAsset[]>;
  private errors: ErrorWithTask[];

  constructor() {
    this.eventsMap = new Map();
    this.errorsMap = new Map();
    this.errors = [];
  }

  public getErrors(): ErrorAsset[] {
    return this.errors.map((error) => error.asset)
  }

  public onInput(task: string, events: InputEvent[]) {
    const input = this.eventsMap.get(task) || [];
    input.push(...events);
    this.eventsMap.set(task, events);
  }

  public onError(task: string, error: ErrorAsset) {
    const input = this.errorsMap.get(task) || [];
    input.push(error);
    this.errorsMap.set(task, input);
  }

  private acknowledgeEvent(task: string, event: InputEvent) {
    if (event.type === EventType.INITIAL) {
      this.errors = this.errors.filter(
        (error) => !(error.task === task && error.asset.entry === event.entry)
      );
    }
    else {
      this.errors = this.errors.filter(
        (error) => !(error.task === task && error.asset.sourcePath === event.path)
      )
    }
  }

  private acknowledgeError(task: string, error: ErrorAsset) {
    if (!this.errors.some(
      (value) => value.task === task
        && value.asset.sourcePath === error.sourcePath)
    ) {
      this.errors.push({
        task,
        asset: error
      });
    }
  }

  public async update() {
    this.eventsMap.forEach(
      (events, task) => events.forEach(
        (event) => this.acknowledgeEvent(task, event)
      )
    );

    this.errorsMap.forEach(
      (errors, task) => errors.forEach(
        (error) => this.acknowledgeError(task, error)
      )
    );

    this.eventsMap.clear();
    this.errorsMap.clear();
  }
}
