import {
  BaseEvent,
  BaseEventOptions
} from "./event-base";
import { EventType } from "../types";
import { FileEvent } from "./event-file";

interface ToFileEventOptions {
  type: EventType.UPDATED | EventType.DELETED
  path: string;
  sourceBase?: string;
}

export class InitialEvent extends BaseEvent {

  constructor(options: BaseEventOptions) {
    super(options);
  }

  public get type(): EventType.INITIAL {
    return EventType.INITIAL;
  }

  public convertToFileEvent(options: ToFileEventOptions) {
    return new FileEvent({
      cacheDir: this.cacheDir,
      cacheKey: this.cacheKey,
      entry: this.entry,
      path: options.path,
      type: options.type,
      sourceBase: options.sourceBase
    });
  }
}
