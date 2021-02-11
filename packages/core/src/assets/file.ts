import fsAsync from 'fs/promises';
import mkdirp from 'mkdirp';
import path from 'path';

import {
  AssetStatus,
  FilePath,
  SourceMap
} from '../types';
import {
  ImmutableAsset,
  ImmutableAssetOptions
} from './immutable';

export const CACHE_NAME = 'assets';

type FileAssetStatus = AssetStatus.SOURCE
  | AssetStatus.ARTIFACT;

type FileAssetOptions = {
  status: FileAssetStatus;
  contents: Buffer;
  sourceMap?: SourceMap;
} & ImmutableAssetOptions;

interface GetTransformedOptions {
  contents: Buffer;
  path: FilePath;
  sourceMap?: SourceMap;
  status?: FileAssetStatus;
}

interface getWithPathOptions {
  path: FilePath;
  status?: FileAssetStatus;
}

export class FileAsset extends ImmutableAsset {
  public readonly status: FileAssetStatus;
  public readonly contents: Buffer;
  public readonly sourceMap: SourceMap | undefined;
  private cachePath: FilePath;

  constructor(options: FileAssetOptions) {
    super(options);
    this.status = options.status;
    this.contents = options.contents;
    this.sourceMap = options.sourceMap;
    this.cachePath = path.join(
      this.event.getCacheDir(CACHE_NAME),
      this.path
    );
  }

  public getCachePath(): FilePath {
    return this.cachePath;
  }

  public getTransformed(options: GetTransformedOptions) {
    const status = options.status || options.status === 0
      ? options.status
      : this.status;

    return new FileAsset({
      status,
      path: options.path,
      event: this.event,
      contents: options.contents,
      sourceMap: options.sourceMap,
    });
  }

  public getWithPath(options: getWithPathOptions) {
    const status = options.status || options.status === 0
      ? options.status
      : this.status;

    return new FileAsset({
      status,
      path: options.path,
      event: this.event,
      contents: this.contents,
      sourceMap: this.sourceMap,
    });
  }

  public async commit() {
    if (this.status === AssetStatus.ARTIFACT) {
      await Promise.all([
        mkdirp(path.dirname(this.distPath)),
        mkdirp(path.dirname(this.cachePath))
      ]);

      const contents = this.getContents();

      let promises = [
        fsAsync.writeFile(this.distPath, contents),
        fsAsync.writeFile(this.cachePath, contents)
      ];

      const sourceMap = this.getSourceMap();

      if (sourceMap) {
        promises = promises.concat([
          fsAsync.writeFile(this.distPath.concat('.map'), sourceMap),
          fsAsync.writeFile(this.cachePath.concat('.map'), sourceMap)
        ])
      }

      await Promise.all(promises);
    }
  }

  private getSourceMap() {
    if (!this.sourceMap) {
      return undefined;
    }
    else {
      const map = {
        ...this.sourceMap.map,
        sourceRoot: path.relative(
          path.dirname(this.distPath),
          this.entry
        ),
        sources: this.sourcePath
          ? [path.relative(this.entry, this.sourcePath)]
          : []
      };

      delete map.sourcesContent;
      return Buffer.from(JSON.stringify(map));
    }
  }

  private getContents() {
    if (!this.sourceMap || !this.sourceMap.referencer) {
      return this.contents;
    }
    else {
      const sourceMapPath = this.distPath.concat('.map');
      const sourceMapFilename = path.basename(sourceMapPath);

      return Buffer.concat([
        this.contents,
        Buffer.from('\n\n'.concat(this.sourceMap.referencer(sourceMapFilename)))
      ]);
    }
  }
}
