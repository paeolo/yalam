import fs from 'fs';
import mkdirp from 'mkdirp';
import path from 'path';
import { finished } from 'stream';
import { promisify } from 'util';

const finishedAsync = promisify(finished);

import {
  AssetStatus,
  FilePath,
  SourceMap
} from '../types';
import { FailedAsset } from './asset-failed';
import {
  ImmutableAsset,
  ImmutableAssetOptions
} from './asset-immutable';

type FileAssetStatus = AssetStatus.SOURCE | AssetStatus.ARTIFACT;

type FileAssetOptions = {
  status?: FileAssetStatus;
  contents?: Buffer;
  sourceMap?: SourceMap;
} & ImmutableAssetOptions;

interface GetTransformedOptions {
  status?: FileAssetStatus;
  path: FilePath;
  contents: Buffer;
  sourceMap?: SourceMap;
}

export class FileAsset extends ImmutableAsset {
  public readonly status: FileAssetStatus;
  public readonly contents: Buffer | undefined;
  public readonly sourceMap: SourceMap | undefined;

  constructor(options: FileAssetOptions) {
    super(options);
    this.status = options.status || AssetStatus.SOURCE;
    this.contents = options.contents;
    this.sourceMap = options.sourceMap;
  }

  public getContentsOrFail() {
    if (!this.contents)
      throw new Error();

    return this.contents;
  }

  public getTransformed(options: GetTransformedOptions) {
    return new FileAsset({
      event: this.event,
      status: options.status,
      path: options.path,
      contents: options.contents,
      sourceMap: options.sourceMap,
    });
  }

  public getArtifact(path: FilePath) {
    return new FileAsset({
      event: this.event,
      status: AssetStatus.ARTIFACT,
      path,
      contents: this.contents,
      sourceMap: this.sourceMap,
    });
  }

  public getFailed(path: FilePath, error: Error) {
    return new FailedAsset({
      event: this.event,
      path,
      error
    })
  }

  public async commit() {
    if (this.status === AssetStatus.ARTIFACT) {
      await this.write();
    }
    return this;
  }

  private async write() {
    const contents = this.getContentsOrFail();
    await mkdirp(this.directory);

    const stream = fs.createWriteStream(this.fullPath);
    stream.write(contents);

    if (this.sourceMap) {
      const sourceMapPath = this.fullPath.concat('.map');
      const sourceMapFilename = path.basename(sourceMapPath);

      const sourceMapStream = fs.createWriteStream(sourceMapPath);
      const stringifiedSourceMap = JSON.stringify(this.sourceMap);

      sourceMapStream.write(stringifiedSourceMap);
      sourceMapStream.end();

      stream.write(Buffer.from(
        '\n\n'.concat(this.sourceMap.referencer(sourceMapFilename))
      ));
      await finishedAsync(sourceMapStream);
    }

    stream.end();
    await finishedAsync(stream);
  }
}
