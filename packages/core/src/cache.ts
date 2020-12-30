import path from 'path';
import mkdirp from 'mkdirp';
import crypto, { BinaryToTextEncoding } from 'crypto';
import fsAsync from 'fs/promises';
import { constants } from 'fs';
import PMap from 'p-map';

import {
  Asset,
  AssetStatus
} from './asset';
import {
  BuildError,
  EventType,
  InputEvent,
  Reporter,
} from './types';
import {
  lockFileAsync,
  unlockFileAsync
} from './utils';

const version = require('../package.json').version;

interface CacheOptions {
  directory: string;
  cacheKey: string;
}

interface FileInfo {
  status: AssetStatus,
  withSourceMap: boolean;
  sourcePath: string;
}

interface ArtifactInfo {
  withSourceMap: boolean;
  sourcePath: string;
}

type FilesTracker = Map<string, Map<string, FileInfo>>;

const enum CacheType {
  ARTIFACTORY = 'artifactory',
  FILE_SYSTEM = 'file_system',
};

export const md5 = (value: string, encoding: BinaryToTextEncoding = 'hex') => {
  return crypto
    .createHash('md5')
    .update(value)
    .digest(encoding)
    .substring(0, 10);
}

export default class Cache implements Reporter {
  private cacheKey: string;
  private directory: string;
  private hashes: Map<string, string>;
  private hash: string;
  private filesTracker: FilesTracker;

  constructor(options: CacheOptions) {
    this.cacheKey = options.cacheKey;
    this.directory = path.resolve(options.directory);
    this.hashes = new Map();
    this.hash = md5(version.concat(this.cacheKey));
    this.filesTracker = new Map();
    this.init();
  }

  private init() {
    mkdirp.sync(this.directory);
  }

  private getHashForEntry(entry: string) {
    let hash = this.hashes.get(entry)
    if (!hash) {
      hash = md5(version.concat(this.cacheKey).concat(entry));
      this.hashes.set(entry, hash);
    }
    return hash;
  }

  private getCacheFilename(entry: string, cacheType: CacheType) {
    switch (cacheType) {
      case CacheType.ARTIFACTORY:
        return cacheType.concat('.')
          .concat(this.getHashForEntry(entry))
          .concat('.json');
      case CacheType.FILE_SYSTEM:
        return cacheType.concat('.')
          .concat(this.getHashForEntry(entry))
          .concat('.txt');
    }
  }

  private getCacheFilePath(entry: string, cacheType: CacheType) {
    return path.join(
      this.directory,
      this.getCacheFilename(entry, cacheType)
    );
  }

  private getLockFilePath(cacheType: CacheType) {
    return path.join(
      this.directory,
      cacheType.concat(this.hash).concat('.lock')
    );
  }

  private async getArtifactory(filePath: string): Promise<Map<string, ArtifactInfo>> {
    let mapResult: Map<string, ArtifactInfo>;

    try {
      const buffer = await fsAsync.readFile(filePath);
      mapResult = new Map(JSON.parse(buffer.toString()));
    } catch {
      mapResult = new Map();
    }

    return mapResult;
  }

  private async updateArtifactory(entry: string, files: Map<string, FileInfo>) {
    if (files.size === 0) {
      return;
    }

    const filePath = this.getCacheFilePath(entry, CacheType.ARTIFACTORY);
    const artifactory = await this.getArtifactory(filePath);

    files.forEach((value, key) => {
      switch (value.status) {
        case AssetStatus.ARTIFACT:
          artifactory.set(
            key,
            {
              withSourceMap: value.withSourceMap,
              sourcePath: value.sourcePath
            }
          );
          break;
        case AssetStatus.DELETED:
          artifactory.delete(key);
          break;
      }
    });

    await fsAsync.writeFile(
      filePath,
      JSON.stringify(Array.from(artifactory.entries()))
    );
  }

  private async getEventsForEntry(entry: string): Promise<InputEvent[]> {
    const filePath = this.getCacheFilePath(entry, CacheType.ARTIFACTORY);
    const artifactory = await this.getArtifactory(filePath);

    if (artifactory.size === 0) {
      return [{
        type: EventType.INITIAL,
        path: entry
      }];
    }
    const events: InputEvent[] = [];
    const map = Array.from(artifactory.entries());

    const addEvents = async ([filePath, value]: [string, ArtifactInfo]) => {
      const tests = [
        fsAsync.access(filePath, constants.F_OK)
      ];
      if (value.withSourceMap) {
        tests.push(fsAsync.access(filePath.concat('.map'), constants.F_OK))
      }
      try {
        await Promise.all(tests);
      } catch {
        events.push({
          type: EventType.UPDATED,
          entry: entry,
          path: value.sourcePath,
        });
      }
    };

    await PMap(
      map,
      addEvents
    );
    return events;
  }

  public async getInputEvents(entries: string[]): Promise<InputEvent[]> {
    const events: InputEvent[] = [];
    const lock = this.getLockFilePath(CacheType.ARTIFACTORY);

    const addEvents = async (entry: string) => events.push(
      ...(await this.getEventsForEntry(entry))
    );

    await lockFileAsync(lock, { wait: 1000 });
    await PMap(
      entries,
      addEvents
    );
    await unlockFileAsync(lock);
    return events;
  }

  public onInput(event: InputEvent) { }

  public onBuilt(asset: Asset) {
    const entry = asset.getEntry();
    const fullPath = asset.getFullPath();
    const forEntry: Map<string, FileInfo> = this.filesTracker.get(entry) || new Map();

    forEntry.set(
      fullPath,
      {
        status: asset.status,
        withSourceMap: !!asset.sourceMap,
        sourcePath: asset.getSourcePath()
      }
    );

    this.filesTracker.set(entry, forEntry);
  }

  public async onIdle(events?: BuildError[]) {
    const entries = Array.from(this.filesTracker.entries());
    const lock = this.getLockFilePath(CacheType.ARTIFACTORY);

    await lockFileAsync(lock, { wait: 1000 });
    await Promise.all(
      entries.map(([key, value]) => this.updateArtifactory(
        key,
        value
      ))
    );
    await unlockFileAsync(lock);
    this.filesTracker.clear();
  }
}
