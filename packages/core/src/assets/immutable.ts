import path from 'path';

import {
  DirectoryPath,
  EventType,
  FilePath,
  InputEvent,
} from '../types';

export interface ImmutableAssetOptions {
  path: FilePath;
  event: InputEvent;
}

export abstract class ImmutableAsset {
  public readonly path: FilePath;
  public readonly event: InputEvent;

  constructor(options: ImmutableAssetOptions) {
    this.path = options.path;
    this.event = options.event;
  }

  abstract commit(): Promise<this>;

  public get entry() {
    return this.event.entry;
  }

  public get distPath(): FilePath {
    return path.join(
      this.event.entry,
      this.path
    );
  }

  public get sourcePath(): FilePath | undefined {
    if (this.event.type === EventType.INITIAL) {
      return undefined;
    }
    else {
      return this.event.path;
    }
  }

  public get directory(): DirectoryPath {
    return path.dirname(this.distPath);
  }
}
