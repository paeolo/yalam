import fs from 'fs/promises';
import mkdirp from 'mkdirp';
import path from 'path';

import {
  FileEvent,
  EventType,
} from './types';

export const enum AssetStatus {
  SOURCE,
  ARTIFACT,
  DELETED,
};

interface AssetOptions {
  status: AssetStatus;
  path: string;
  event: FileEvent;
}

export class Asset {
  public status: AssetStatus;
  public path: string;
  private event: FileEvent;
  private contents: Buffer | undefined;

  constructor(options: AssetOptions) {
    this.status = options.status;
    this.path = options.path;
    this.event = options.event;
  }

  public get type(): EventType.ASSET {
    return EventType.ASSET;
  }

  public getEntry() {
    return this.event.entry;
  }

  public getEvent() {
    return this.event;
  }

  public getFullPath() {
    return path.join(this.event.entry, this.path);
  }

  public getDirectory() {
    return path.dirname(this.getFullPath());
  }

  public getContentsOrFail() {
    if (!this.contents) {
      throw new Error();
    }
    return this.contents;
  }

  public setContents(contents: Buffer) {
    this.contents = contents;
  }

  public async commit() {
    switch (this.status) {
      case AssetStatus.SOURCE:
        break;
      case AssetStatus.DELETED:
        await fs.unlink(this.getFullPath());
        break;
      case AssetStatus.ARTIFACT:
        await mkdirp(this.getDirectory());
        await fs.writeFile(
          this.getFullPath(),
          this.getContentsOrFail()
        );
        break;
    }
    return this;
  }
}
