import {
  ImmutableEvent,
  BaseEventOptions
} from "./event-immutable";
import {
  EventType,
  FilePath,
  DirectoryPath
} from "../types";
import { FileEvent } from "./event-file";

interface GetFileEventOptions {
  type: EventType.UPDATED | EventType.DELETED
  path: FilePath;
  sourceBase?: DirectoryPath;
}

export class InitialEvent extends ImmutableEvent {
  constructor(options: BaseEventOptions) {
    super(options);
  }

  public get type(): EventType.INITIAL {
    return EventType.INITIAL;
  }

  public getFileEvent(options: GetFileEventOptions) {
    return new FileEvent({
      cache: this.cache,
      entry: this.entry,
      path: options.path,
      type: options.type,
      sourceBase: options.sourceBase
    });
  }
}
