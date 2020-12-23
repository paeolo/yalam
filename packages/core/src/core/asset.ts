import fs from 'fs/promises';
import mkdirp from 'mkdirp';
import path from 'path';

import { NO_CONTENTS } from '../errors';
import { FileEvent } from './types';

export const enum AssetType {
  SOURCE,
  ARTIFACT,
  DELETED
};

interface AssetOptions {
  type: AssetType;
  path: string;
  event: FileEvent;
}

export class Asset {
  public type: AssetType;
  public path: string;
  private event: FileEvent;
  private contents: Buffer | undefined;

  constructor(options: AssetOptions) {
    this.type = options.type;
    this.path = options.path;
    this.event = options.event;
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

  public getContents() {
    return this.contents || Buffer.alloc(0);
  }

  public setContent(contents: Buffer) {
    this.contents = contents;
  }

  public async writeFile() {
    if (!this.contents) {
      throw NO_CONTENTS();
    }

    const fullPath = path.join(this.event.entry, this.path);
    await mkdirp(path.dirname(fullPath));
    await fs.writeFile(fullPath, this.contents);
  }

  public async deleteFile() {
    const fullPath = path.join(this.event.entry, this.path);
    try {
      await fs.unlink(fullPath);
    } catch { }
  }
}
