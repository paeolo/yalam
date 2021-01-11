import {
  EventType,
  Path
} from "../types";

interface InitialEventOptions {
  cacheDir: Path;
  entry: Path;
}

export class InitialEvent {
  private options: InitialEventOptions;

  constructor(options: InitialEventOptions) {
    this.options = options;
  }

  public get type(): EventType.INITIAL {
    return EventType.INITIAL;
  }

  public get cacheDir() {
    return this.options.cacheDir;
  }

  public get entry() {
    return this.options.entry;
  }
}
