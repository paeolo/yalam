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
  FAILED
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
  private error: Error | undefined;

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

  public setFailed(error: Error) {
    this.status = AssetStatus.FAILED;
    this.error = error;
  }

  public getError() {
    return this.error;
  }

  public getContents() {
    return this.contents || Buffer.alloc(0);
  }

  public setContents(contents: Buffer) {
    this.contents = contents;
  }

  public async writeFile() {
    if (!this.contents) {
      throw new Error(`No contents to write`);
    }
    const fullPath = path.join(this.event.entry, this.path);
    const directory = path.dirname(fullPath);

    await mkdirp(directory);
    await fs.writeFile(fullPath, this.contents);
  }

  public async deleteFile() {
    const fullPath = path.join(this.event.entry, this.path);
    try {
      await fs.unlink(fullPath);
    } catch { }
  }
}
