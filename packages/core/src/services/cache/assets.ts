import fsAsync from 'fs/promises';
import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import { inject } from "@loopback/context";

import {
  DeletedAsset,
  FileAsset
} from "../../assets";
import {
  IAssetCache
} from "../../interfaces";
import {
  CacheBindings
} from "../../keys";
import {
  DirectoryPath,
  FilePath
} from "../../types";

const FILENAME = 'assets.json';

interface Asset {
  distPath: FilePath;
  cachePath: FilePath,
  sourceMap: boolean;
}

export class AssetCache implements IAssetCache {
  private filePath: FilePath;
  private assets: Asset[];
  private deleted: string[];

  constructor(
    @inject(CacheBindings.REQUEST_CACHE_DIR) private requestCacheDir: DirectoryPath,
  ) {
    this.filePath = path.join(
      this.requestCacheDir,
      FILENAME
    );
    this.assets = [];
    this.deleted = [];
  }

  private async getAssets(): Promise<Asset[]> {
    try {
      return JSON.parse(
        (await fsAsync.readFile(this.filePath))
          .toString()
      )
    } catch {
      return [];
    }
  }

  private async writeAssets(assets: Asset[]) {
    return fsAsync.writeFile(
      this.filePath,
      JSON.stringify(assets, undefined, 2)
    );
  }

  private async copyIfNeeded(cachePath: FilePath, distPath: FilePath) {
    try {
      await fsAsync.access(distPath, fs.constants.F_OK);
    } catch {
      await mkdirp(path.dirname(distPath));
      await fsAsync.copyFile(
        cachePath,
        distPath
      );
    }
  }

  public async onBuilt(asset: FileAsset) {
    const isEqual = (value: Asset) => value.distPath === asset.distPath;

    if (!this.assets.some(isEqual)) {
      this.assets.push({
        distPath: asset.distPath,
        cachePath: asset.getCachePath(),
        sourceMap: !!asset.sourceMap,
      });
    }
  }
  public async onDeleted(asset: DeletedAsset) {
    const isEqual = (value: string) => value === asset.distPath;

    if (!this.deleted.some(isEqual)) {
      this.deleted.push(asset.distPath);
    }
  }

  public async sync() {
    const assets = await this.getAssets();

    if (assets.length === 0) {
      return false;
    }

    const onAsset = async (asset: Asset) => {
      const promises = [
        this.copyIfNeeded(
          asset.cachePath,
          asset.distPath
        )
      ];
      if (asset.sourceMap) {
        promises.push(
          this.copyIfNeeded(
            asset.cachePath.concat('.map'),
            asset.distPath.concat('.map'),
          ));
      }
      await Promise.all(promises);
    }

    await Promise.all(assets.map(onAsset));
    return true;
  }

  public async batchUpdate() {
    const result: Asset[] = [];
    const assets = await this.getAssets();

    assets.forEach((asset) => {
      if (!this.deleted.some(value => value === asset.distPath)) {
        result.push(asset);
      }
    });

    this.assets.forEach((asset) => {
      if (!assets.some(value => value.distPath === asset.distPath)) {
        result.push({
          distPath: asset.distPath,
          cachePath: asset.cachePath,
          sourceMap: asset.sourceMap
        });
      }
    });

    await this.writeAssets(result);
  }
}
