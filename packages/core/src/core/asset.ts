import path from 'path';
import fs from 'fs/promises';
import {
  CANNOT_WRITE_SOURCE
} from '../errors';

export const enum AssetType {
  SOURCE,
  ARCTIFACT,
  DELETED
};

interface AssetOptions {
  filePath: string;
  contents: Buffer;
}

export class Asset {
  public filePath: string;
  public contents: Buffer;
  public type: AssetType;

  constructor(options: AssetOptions) {
    this.filePath = options.filePath;
    this.contents = options.contents;
    this.type = AssetType.SOURCE;
  }

  public async write() {
    if (this.type === AssetType.SOURCE)
      throw CANNOT_WRITE_SOURCE(path.basename(this.filePath));

    return fs.writeFile(this.filePath, this.contents);
  }
}
