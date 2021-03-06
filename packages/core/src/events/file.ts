import {
  ImmutableEvent,
  BaseEventOptions
} from "./immutable";
import {
  DirectoryPath,
  EventType,
  FilePath
} from "../types";
import { InitialEvent } from "./initial";

type FileEventOptions = {
  type: EventType.UPDATED | EventType.DELETED;
  path: FilePath;
  sourceBase?: DirectoryPath;
} & BaseEventOptions;

export class FileEvent extends ImmutableEvent {
  public readonly type: EventType.UPDATED | EventType.DELETED;
  public readonly path: FilePath;
  public readonly sourceBase?: DirectoryPath;

  constructor(options: FileEventOptions) {
    super(options);
    this.type = options.type;
    this.path = options.path;
    this.sourceBase = options.sourceBase;
  }

  public getWithSourceBase(sourceBase: string) {
    return new FileEvent({
      cache: this.cache,
      pkg_name: this.pkg_name,
      entry: this.entry,
      path: this.path,
      type: this.type,
      sourceBase: sourceBase
    })
  }

  public getInitialEvent() {
    return new InitialEvent({
      cache: this.cache,
      pkg_name: this.pkg_name,
      entry: this.entry
    })
  }
}
