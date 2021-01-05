import {
  EventType,
  Path
} from "../types";

interface FileEventOptions {
  type: EventType.UPDATED | EventType.DELETED;
  cacheDir: Path;
  entry: Path;
  path: Path;
}

export class FileEvent {
  private options: FileEventOptions;

  constructor(options: FileEventOptions) {
    this.options = options;
  }

  public get type() {
    return this.options.type;
  }
  public get entry() {
    return this.options.entry;
  }

  public get path() {
    return this.options.path;
  }

  public get cacheDir() {
    return this.options.cacheDir;
  }
}
