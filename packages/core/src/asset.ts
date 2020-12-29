import fsAsync from 'fs/promises';
import fs from 'fs';
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

  private async write() {
    const contents = this.getContentsOrFail();
    await mkdirp(this.getDirectory());

    const stream = fs.createWriteStream(this.getFullPath());
    stream.write(contents);

    if (this.sourceMap) {
      const sourceMapPath = this.getFullPath().concat('.map');
      const sourceMapFilename = path.basename(sourceMapPath);

      await fsAsync.writeFile(
        sourceMapPath,
        JSON.stringify(this.sourceMap)
      );

      stream.write(Buffer.from(
        '\n\n'.concat(this.sourceMap.referencer(sourceMapFilename))
      ));
    }

    stream.end();
    await new Promise(resolve => stream.once('finish', resolve));
  }

  private async unlink() {
    try {
      await fsAsync.unlink(this.getFullPath());
      await fsAsync.unlink(this.getFullPath().concat('.map'));
    } catch { }
  }

  public async commit() {
    switch (this.status) {
      case AssetStatus.SOURCE:
        break;
      case AssetStatus.DELETED:
        await this.unlink();
        break;
      case AssetStatus.ARTIFACT:
        await this.write();
        break;
    }
    return this;
  }
}
