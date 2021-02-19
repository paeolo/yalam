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

interface PipelineError {
  pipeline: string;
  asset: ErrorAsset;
}

export class ErrorRegistry implements IErrorRegistry {
  private eventsMap: Map<string, InputEvent[]>;
  private errorsMap: Map<string, ErrorAsset[]>;
  private errors: PipelineError[];

  constructor() {
    this.eventsMap = new Map();
    this.errorsMap = new Map();
    this.errors = [];
  }

  public getErrors(): ErrorAsset[] {
    return this.errors.map((error) => error.asset);
  }

  public onInput(pipeline: string, events: InputEvent[]) {
    this.eventsMap.set(
      pipeline,
      (this.eventsMap.get(pipeline) || []).concat(events)
    );
  }

  public onError(pipeline: string, error: ErrorAsset) {
    this.errorsMap.set(
      pipeline,
      (this.errorsMap.get(pipeline) || []).concat([error])
    );
  }

  private batchUpdateEvent(pipeline: string, event: InputEvent) {
    let filter;

    switch (event.type) {
      case EventType.INITIAL:
        filter = (error: PipelineError) => error.pipeline !== pipeline
          || error.asset.entry !== event.entry;
        break;
      default:
        filter = (error: PipelineError) => error.pipeline !== pipeline
          || error.asset.sourcePath !== event.path;
        break;
    }

    this.errors = this.errors.filter(filter);
  }

  private batchUpdateError(pipeline: string, error: ErrorAsset) {
    const hasError = (value: PipelineError) => value.asset.sourcePath === error.sourcePath
      && value.pipeline === pipeline;

    if (!this.errors.some(hasError)) {
      this.errors.push({
        pipeline,
        asset: error
      });
    }
  }

  public batchUpdate() {
    this.eventsMap
      .forEach((events, pipeline) => events
        .forEach((event) => this.batchUpdateEvent(pipeline, event))
      );
    this.eventsMap.clear();

    this.errorsMap
      .forEach((errors, pipeline) => errors
        .forEach((error) => this.batchUpdateError(pipeline, error))
      );
    this.errorsMap.clear();
  }
}
