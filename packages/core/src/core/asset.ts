import fs from 'fs/promises';
import mkdirp from 'mkdirp';
import path from 'path';

import { NO_CONTENTS } from '../errors';

export const enum AssetType {
  SOURCE,
  ARCTIFACT,
  DELETED
};

interface AssetOptions {
  type: AssetType;
  entry: string;
  path: string;
}

export class Asset {
  public type: AssetType;
  private entry: string;
  public path: string;
  private contents?: Buffer;

  constructor(options: AssetOptions) {
    this.type = options.type;
    this.entry = options.entry;
    this.path = options.path;
  }

  public getEntry() {
    return this.entry;
  }

  public getContents() {
    return this.contents || Buffer.alloc(0);
  }

  public setContent(contents: Buffer) {
    this.contents = contents;
  }

  public async write() {
    if (!this.contents) {
      throw NO_CONTENTS();
    }

    const fullPath = path.join(this.entry, this.path);

    await mkdirp(path.dirname(fullPath));
    await fs.writeFile(fullPath, this.contents);
  }
}
