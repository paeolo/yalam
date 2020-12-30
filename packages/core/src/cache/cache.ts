import path from 'path';
import mkdirp from 'mkdirp';
import watcher from '@parcel/watcher';
import crypto, { BinaryToTextEncoding } from 'crypto';
import fsAsync from 'fs/promises';
import { constants } from 'fs';
import PMap from 'p-map';

import {
  AssetStatus,
  EventType,
  InputEvent,
  Reporter,
} from '../types';
import {
  lockFileAsync,
  unlockFileAsync
} from '../utils';
import {
  DeletedAsset,
  FailedAsset,
  FileAsset
} from '../asset';
import { GLOBAL_LOCK } from '../misc';

const version = require('../../package.json').version;

interface CacheOptions {
  directory: string;
  cacheKey: string;
}

interface BuiltFileInfo {
  status: AssetStatus.ARTIFACT,
  task: string;
  withSourceMap: boolean;
  sourcePath: string;
}

interface DeletedFileInfo {
  status: AssetStatus.DELETED,
}

type FileInfo = BuiltFileInfo | DeletedFileInfo;

interface CachedInfo {
  task: string;
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

export class Cache implements Reporter {
  private cacheKey: string;
  private directory: string;
  private hashes: Map<string, string>;
  private filesTracker: FilesTracker;

  constructor(options: CacheOptions) {
    this.cacheKey = options.cacheKey;
    this.directory = path.resolve(options.directory);
    this.hashes = new Map();
    this.filesTracker = new Map();
    this.init();
  }

  private init() {
    mkdirp.sync(this.directory);
  }

  private getSpecificHashForEntry(entry: string) {
    const key = entry
      .concat(version)
      .concat(this.cacheKey);

    let hash = this.hashes.get(key)
    if (!hash) {
      hash = md5(key)
      this.hashes.set(key, hash);
    }
    return hash;
  }

  private getHashForEntry(entry: string) {
    let hash = this.hashes.get(entry)
    if (!hash) {
      hash = md5(entry);
      this.hashes.set(entry, hash);
    }
    return hash;
  }

  private getCacheFilename(entry: string, cacheType: CacheType) {
    switch (cacheType) {
      case CacheType.ARTIFACTORY:
        return cacheType.concat('.')
          .concat(this.getSpecificHashForEntry(entry))
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

  private getLockFilePath() {
    return path.join(
      this.directory,
      GLOBAL_LOCK
    );
  }

  private async getEventsForEntry(entry: string, task: string): Promise<InputEvent[]> {
    const filePath = this.getCacheFilePath(entry, CacheType.ARTIFACTORY);

    const [
      artifactory,
      fileEvents
    ] = await Promise.all([
      this.getArtifactory(filePath),
      watcher.getEventsSince(
        entry,
        this.getCacheFilePath(entry, CacheType.FILE_SYSTEM),
        { ignore: [this.directory] }
      )]
    );

    if (artifactory.size === 0) {
      return [{
        type: EventType.INITIAL,
        path: entry
      }];
    }

    const events: InputEvent[] = fileEvents.map((event) => ({
      type: event.type === 'delete'
        ? EventType.DELETED
        : EventType.UPDATED,
      entry,
      path: event.path
    }));

    const map = Array.from(artifactory.entries());

    const addEvents = async ([filePath, value]: [string, CachedInfo]) => {
      if (value.task !== task) {
        events.push({
          type: EventType.UPDATED,
          entry: entry,
          path: value.sourcePath,
        });
        return;
      }

      const tests = [
        fsAsync.access(filePath, constants.F_OK)
      ];
      if (value.withSourceMap) {
        tests.push(fsAsync.access(filePath.concat('.map'), constants.F_OK))
      }
      try {
        await Promise.all(tests);
      } catch {
        if (!events.some(event => event.path === value.sourcePath)) {
          events.push({
            type: EventType.UPDATED,
            entry: entry,
            path: value.sourcePath,
          });
        }
      }
    };

    await PMap(
      map,
      addEvents
    );
    return events;
  }

  public async getInputEvents(entries: string[], task: string): Promise<InputEvent[]> {
    const events: InputEvent[] = [];
    const lock = this.getLockFilePath();

    const addEvents = async (entry: string) => events.push(
      ...(await this.getEventsForEntry(entry, task))
    );

    await lockFileAsync(lock, { wait: 1000 });
    await PMap(
      entries,
      addEvents
    );
    await unlockFileAsync(lock);
    return events;
  }

  private async writeSnapshot(entries: string[]) {
    await Promise.all(
      entries.map((entry) => {
        watcher.writeSnapshot(
          entry,
          this.getCacheFilePath(entry, CacheType.FILE_SYSTEM),
          { ignore: [this.directory] }
        )
      })
    )
  }

  private async getArtifactory(filePath: string): Promise<Map<string, CachedInfo>> {
    let mapResult: Map<string, CachedInfo>;

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
              task: value.task,
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

  private trackFileStatus(entry: string, key: string, info: FileInfo) {
    const value: Map<string, FileInfo> = this.filesTracker.get(entry)
      || new Map();

    value.set(key, info);
    this.filesTracker.set(entry, value);
  }

  public onBuilt(asset: FileAsset, task: string) {
    this.trackFileStatus(
      asset.getEntry(),
      asset.getFullPath(),
      {
        status: AssetStatus.ARTIFACT,
        task,
        withSourceMap: !!asset.sourceMap,
        sourcePath: asset.getSourcePath()
      }
    );
  }

  public onDeleted(asset: DeletedAsset) {
    this.trackFileStatus(
      asset.getEntry(),
      asset.getFullPath(),
      { status: AssetStatus.DELETED }
    );
  }

  public async onIdle(assets?: FailedAsset[]) {
    const entries = Array.from(this.filesTracker.entries());
    const lock = this.getLockFilePath();

    const updateArtifactory = async () => {
      await Promise.all(
        entries.map(([key, value]) => this.updateArtifactory(
          key,
          value
        ))
      );
    };

    await lockFileAsync(lock, { wait: 1000 });

    await Promise.all([
      updateArtifactory(),
      this.writeSnapshot(Array.from(this.filesTracker.keys()))
    ]);

    await unlockFileAsync(lock);
    this.filesTracker.clear();
  }
}
