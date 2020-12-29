import fs from 'fs/promises';
import mkdirp from 'mkdirp';
import path from 'path';

import {
  FileEvent,
  SourceMap
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
  public sourceMap: SourceMap | undefined;
  private contents: Buffer | undefined;
  private event: FileEvent;

  constructor(options: AssetOptions) {
    this.status = options.status;
    this.path = options.path;
    this.event = options.event;
  }

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
        if (this.sourceMap) {
          await fs.writeFile(
            this.getFullPath().concat('.map'),
            JSON.stringify(this.sourceMap)
          );
        }
        break;
    }
    return this;
  }
}
