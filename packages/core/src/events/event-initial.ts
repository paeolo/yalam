import {
  EventType,
  Path
} from "../types";

interface InitialEventOptions {
  path: Path;
}

export class InitialEvent {
  private options: InitialEventOptions;

  constructor(options: InitialEventOptions) {
    this.options = options;
  }

  public get type(): EventType.INITIAL {
    return EventType.INITIAL;
  }

  public get path() {
    return this.options.path;
  }
}
