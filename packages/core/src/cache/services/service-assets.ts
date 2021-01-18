import fsAsync from 'fs/promises';
import fs from 'fs';
import mkdirp from 'mkdirp';
import path from 'path';

import {
  lockFileAsync,
  unlockFileAsync
} from '../../utils';
import {
  DeletedAsset,
  FileAsset
} from "../../asset";
import {
  DirectoryPath,
  Reporter
} from "../../types";
import { CACHE_NAME } from "../../constants";
import { HashService } from './service-hash';

const FILE_PREFIX = 'assets';

const enum Status {
  UPDATED,
  DELETED
}

interface InMemoryArtifact {
  status: Status;
  distPath: FilePath;
  cachePath?: FilePath,
  sourceMap?: boolean;
}

interface OnDiskArtifact {
  distPath: FilePath,
  cachePath: FilePath,
  sourceMap?: boolean;
}

interface AssetServiceOptions {
  cacheDir: DirectoryPath;
  hashes: HashService;
}

export class AssetService implements Reporter {
  private cacheDir: DirectoryPath;
  private hashes: HashService;
  private map: Map<DirectoryPath, InMemoryArtifact[]>;

  constructor(options: AssetServiceOptions) {
    this.cacheDir = options.cacheDir;
    this.hashes = options.hashes;
    this.map = new Map();
  }

  private getEntries(): DirectoryPath[] {
    return Array.from(this.map.keys());
  }

  private getLockFilePath() {
    return path.join(
      this.cacheDir,
      CACHE_NAME,
      FILE_PREFIX.concat('.lock')
    );
  }

  private getCacheFilePath(entry: DirectoryPath) {
    const fileName = FILE_PREFIX.concat('.')
      .concat(this.hashes.getHashForEntry(entry))
      .concat('.json');

    return path.join(
      this.cacheDir,
      CACHE_NAME,
      fileName,
    );
  }

  private async getAssets(entry: DirectoryPath): Promise<OnDiskArtifact[]> {
    try {
      return JSON.parse(
        (await fsAsync.readFile(this.getCacheFilePath(entry)))
          .toString()
      );
    } catch {
      return [];
    }
  }

  private async writeAssets(entry: DirectoryPath, assets: OnDiskArtifact[]) {
    return fsAsync.writeFile(
      this.getCacheFilePath(entry),
      JSON.stringify(assets, undefined, 2)
    );
  }

  private async updateEntry(entry: DirectoryPath) {
    const assets: OnDiskArtifact[] = [];
    const onDisk = await this.getAssets(entry);
    const inMemory = this.map.get(entry) || [];

    onDisk.forEach((asset) => {
      if (!inMemory.some(value => value.distPath === asset.distPath
        && value.status === Status.DELETED)) {
        assets.push(asset);
      }
    });

    inMemory.forEach((asset) => {
      if (!onDisk.some(value => value.distPath === asset.distPath)
        && asset.status === Status.UPDATED) {
        assets.push({
          distPath: asset.distPath,
          cachePath: asset.cachePath!,
          sourceMap: asset.sourceMap
        });
      }
    });

    await this.writeAssets(entry, assets);
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

  private async syncEntry(entry: DirectoryPath) {
    const onDisk = await this.getAssets(entry);

    const onArtifact = async (artifact: OnDiskArtifact) => {
      const promises = [
        this.copyIfNeeded(
          artifact.cachePath,
          artifact.distPath
        )
      ];
      if (artifact.sourceMap) {
        promises.push(
          this.copyIfNeeded(
            artifact.cachePath.concat('.map'),
            artifact.distPath.concat('.map'),
          ));
      }
      await Promise.all(promises);
    }

    await Promise.all(
      onDisk.map(onArtifact)
    );
  }

  public onBuilt(task: string, asset: FileAsset) {
    const entry = asset.entry;
    const assets = this.map.get(entry) || [];

    const isEqual = (value: InMemoryArtifact) => value.distPath === asset.distPath
      && value.status === Status.UPDATED;

    if (!assets.some(isEqual)) {
      assets.push({
        status: Status.UPDATED,
        distPath: asset.distPath,
        sourceMap: !!asset.sourceMap,
        cachePath: asset.getCachePath()
      })
    }
    this.map.set(entry, assets);
  }

  public onDeleted(task: string, asset: DeletedAsset) {
    const entry = asset.entry;
    const assets = this.map.get(entry) || [];

    const isEqual = (value: InMemoryArtifact) => value.distPath === asset.distPath
      && value.status === Status.DELETED;

    if (!assets.some(isEqual)) {
      assets.push({
        status: Status.DELETED,
        distPath: asset.distPath,
      })
    }
    this.map.set(entry, assets);
  }

  public async update() {
    const lockFilePath = this.getLockFilePath();
    const entries = this.getEntries().sort();
    await lockFileAsync(lockFilePath);

    await Promise.all(
      entries.map(entry => this.updateEntry(entry))
    );

    this.map.clear();
    await unlockFileAsync(lockFilePath);
  }

  public async sync(entries: DirectoryPath[]) {
    const lockFilePath = this.getLockFilePath();
    await lockFileAsync(lockFilePath);

    await Promise.all(
      entries
        .sort()
        .map(entry => this.syncEntry(entry))
    );

    await unlockFileAsync(lockFilePath);
  }
}
