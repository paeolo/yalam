import {
  ErrorAsset
} from "../../assets";
import {
  EventType,
  InputEvent
} from '../../types'
import {
  IErrorRegistry
} from "../../interfaces";

interface TaskError {
  task: string;
  asset: ErrorAsset;
}

export class ErrorRegistry implements IErrorRegistry {
  private eventsMap: Map<string, InputEvent[]>;
  private errorsMap: Map<string, ErrorAsset[]>;
  private errors: TaskError[];

  constructor() {
    this.eventsMap = new Map();
    this.errorsMap = new Map();
    this.errors = [];
  }

  public getErrors(): ErrorAsset[] {
    return this.errors.map((error) => error.asset);
  }

  public onInput(task: string, events: InputEvent[]) {
    this.eventsMap.set(
      task,
      (this.eventsMap.get(task) || []).concat(events)
    );
  }

  public onError(task: string, error: ErrorAsset) {
    this.errorsMap.set(
      task,
      (this.errorsMap.get(task) || []).concat([error])
    );
  }

  private batchUpdateEvent(task: string, event: InputEvent) {
    let filter;

    switch (event.type) {
      case EventType.INITIAL:
        filter = (error: TaskError) => error.task !== task || error.asset.entry !== event.entry;
        break;
      default:
        filter = (error: TaskError) => error.task !== task || error.asset.sourcePath !== event.path;
        break;
    }

    this.errors = this
      .errors
      .filter(filter);
  }

  private batchUpdateError(task: string, error: ErrorAsset) {
    const hasError = (value: TaskError) => value.asset.sourcePath === error.sourcePath
      && value.task === task;

    if (!this.errors.some(hasError)) {
      this.errors.push({
        task,
        asset: error
      });
    }
  }

  public batchUpdate() {
    this.eventsMap
      .forEach((events, task) => events
        .forEach((event) => this.batchUpdateEvent(task, event))
      );
    this.eventsMap.clear();

    this.errorsMap
      .forEach((errors, task) => errors
        .forEach((error) => this.batchUpdateError(task, error))
      );
    this.errorsMap.clear();
  }
}
