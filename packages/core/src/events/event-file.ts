import {
  BaseEvent,
  BaseEventOptions
} from "./event-base";
import {
  EventType,
  Path
} from "../types";
import { InitialEvent } from "./event-initial";

type FileEventOptions = {
  type: EventType.UPDATED | EventType.DELETED;
  path: Path;
  sourceBase?: Path;
} & BaseEventOptions;

export class FileEvent extends BaseEvent {
  public readonly type: EventType.UPDATED | EventType.DELETED;
  public readonly path: Path;
  public readonly sourceBase?: Path;

  constructor(options: FileEventOptions) {
    super(options);
    this.type = options.type;
    this.path = options.path;
    this.sourceBase = options.sourceBase;
  }

  public withSourceBase(sourceBase: string) {
    return new FileEvent({
      cacheDir: this.cacheDir,
      cacheKey: this.cacheKey,
      entry: this.entry,
      path: this.path,
      type: this.type,
      sourceBase: sourceBase
    })
  }

  public convertToInitialEvent() {
    return new InitialEvent({
      cacheDir: this.cacheDir,
      cacheKey: this.cacheKey,
      entry: this.entry
    })
  }
}
