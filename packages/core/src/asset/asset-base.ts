import path from 'path';

import {
  FileEvent,
} from '../types';

export interface BaseAssetOptions {
  path: string;
  event: FileEvent;
}

export abstract class BaseAsset {
  public path: string;
  private event: FileEvent;

  constructor(options: BaseAssetOptions) {
    this.path = options.path;
    this.event = options.event;
  }

  abstract commit(): Promise<this>

  public getEntry() {
    return this.event.entry;
  }

  public getEvent() {
    return this.event;
  }

  public getSourcePath() {
    return this.event.path;
  }

  public getFullPath() {
    return path.join(
      this.event.entry,
      this.path
    );
  }

  public getDirectory() {
    return path.dirname(this.getFullPath());
  }
}
