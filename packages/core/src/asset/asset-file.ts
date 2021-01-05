import fsAsync from 'fs/promises';
import fs from 'fs';
import mkdirp from 'mkdirp';
import path from 'path';

import {
  AssetStatus,
  Path,
  SourceMap
} from '../types';
import {
  BaseAsset,
  BaseAssetOptions
} from './asset-base';

type FileAssetOptions = {
  cacheDir: Path;
} & BaseAssetOptions;

export class FileAsset extends BaseAsset {
  public status: AssetStatus.SOURCE | AssetStatus.ARTIFACT;
  public sourceMap: SourceMap | undefined;
  private contents: Buffer | undefined;
  public readonly cacheDir: Path;

  constructor(options: FileAssetOptions) {
    super(options);
    this.status = AssetStatus.SOURCE;
    this.cacheDir = options.cacheDir;
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
