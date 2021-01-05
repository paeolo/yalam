import path from 'path';
import mkdirp from 'mkdirp';
import watcher from '@parcel/watcher';
import crypto, { BinaryToTextEncoding } from 'crypto';
import fsAsync from 'fs/promises';
import { constants } from 'fs';
import PMap from 'p-map';

import {
  Asset,
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
import { GLOBAL_LOCK } from '../constants';
import {
  CacheOptions,
  CacheType,
  CachedInfo,
  FileInfo,
  FilesTracker
} from './types';
import { FileEvent, InitialEvent } from '../events';

const version = require('../../package.json').version;

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

  private async getEventsForEntry(task: string, entry: string): Promise<InputEvent[]> {
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
      return [
        new InitialEvent({ path: entry })
      ];
    }

    const events: InputEvent[] = fileEvents.map((event) => new FileEvent({
      type: event.type === 'delete'
        ? EventType.DELETED
        : EventType.UPDATED,
      entry,
      path: event.path
    }));

    const map = Array.from(artifactory.entries());

    const addEvents = async ([filePath, value]: [string, CachedInfo]) => {
      if ((value.status === AssetStatus.ARTIFACT && value.task !== task)
        || value.status === AssetStatus.FAILED) {
        if (!events.some(event => event.path === value.sourcePath)) {
          events.push(new FileEvent({
            type: EventType.UPDATED,
            entry: entry,
            path: value.sourcePath,
          }));
        }
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
          events.push(new FileEvent({
            type: EventType.UPDATED,
            entry: entry,
            path: value.sourcePath,
          }));
        }
      }
    };

    await PMap(
      map,
      addEvents
    );
    return events;
  }

  public async getInputEvents(task: string, entries: string[]): Promise<InputEvent[]> {
    const events: InputEvent[] = [];
    const lock = this.getLockFilePath();

    const addEvents = async (entry: string) => events.push(
      ...(await this.getEventsForEntry(task, entry))
    );

    await lockFileAsync(lock);
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
        case AssetStatus.FAILED:
          artifactory.set(key, value);
          break;
        case AssetStatus.DELETED:
          artifactory.delete(key);
          break;
      }
    });

    await fsAsync.writeFile(
      filePath,
      JSON.stringify(Array.from(artifactory.entries()), undefined, 2)
    );
  }

  private trackFileStatus(asset: Asset, task?: string) {
    const entry = asset.getEntry();
    const fullPath = asset.getFullPath();
    const value: Map<string, FileInfo> = this.filesTracker.get(entry)
      || new Map();

    switch (asset.status) {
      case AssetStatus.ARTIFACT:
        value.set(
          fullPath,
          {
            status: AssetStatus.ARTIFACT,
            task: task!,
            withSourceMap: !!asset.sourceMap,
            sourcePath: asset.getSourcePath()
          }
        );
        break;
      case AssetStatus.FAILED:
        value.set(
          fullPath,
          {
            status: AssetStatus.FAILED,
            sourcePath: asset.getSourcePath()
          }
        );
        break;
      case AssetStatus.DELETED:
        value.set(
          fullPath,
          { status: AssetStatus.DELETED }
        );
        break;
    }
    this.filesTracker.set(entry, value);
  }

  public onBuilt(asset: FileAsset, task: string) {
    this.trackFileStatus(asset, task);
  }

  public onDeleted(asset: DeletedAsset) {
    this.trackFileStatus(asset);
  }

  public async onIdle(assets?: FailedAsset[]) {
    if (assets) {
      assets.forEach((asset) => this.trackFileStatus(asset));
    }

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

    await lockFileAsync(lock);

    await Promise.all([
      updateArtifactory(),
      this.writeSnapshot(Array.from(this.filesTracker.keys()))
    ]);

    await unlockFileAsync(lock);
    this.filesTracker.clear();
  }
}
