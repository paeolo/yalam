import fsAsync from 'fs/promises';
import fs from 'fs';
import mkdirp from 'mkdirp';
import path from 'path';

import {
  AssetStatus,
  SourceMap
} from '../types';
import {
  BaseAsset,
  BaseAssetOptions
} from './asset-base';

export class FileAsset extends BaseAsset {
  public status: AssetStatus.SOURCE | AssetStatus.ARTIFACT;
  private sourceMap: SourceMap | undefined;
  private contents: Buffer | undefined;

  constructor(options: BaseAssetOptions) {
    super(options);
    this.status = AssetStatus.SOURCE;
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

  public getSourceMap() {
    return this.sourceMap;
  }

  public deleteSourceMap() {
    this.sourceMap = undefined;
  }

  public setSourceMap(sourceMap: SourceMap) {
    this.sourceMap = sourceMap;
  }

  public async commit() {
    if (this.status === AssetStatus.ARTIFACT) {
      await this.write();
    }
    return this;
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
}
