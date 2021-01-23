import path from 'path';

import {
  EventType,
  DirectoryPath
} from "../types";

export interface CacheMeta {
  directory: DirectoryPath;
  key: string;
}

export interface BaseEventOptions {
  entry: DirectoryPath;
  cache: CacheMeta;
}

export abstract class ImmutableEvent {
  public readonly entry: DirectoryPath;
  public readonly cache: CacheMeta;

  constructor(options: BaseEventOptions) {
    this.entry = options.entry;
    this.cache = options.cache;
  }

  public abstract get type(): EventType;

  public getCacheDir(cacheName: string): DirectoryPath {
    return path.join(
      this.cache.directory,
      cacheName,
      this.cache.key
    );
  }
}
