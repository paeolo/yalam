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
  pkg_name: string;
  entry: DirectoryPath;
  cache: CacheMeta;
}

export abstract class ImmutableEvent {
  public readonly pkg_name: string;
  public readonly entry: DirectoryPath;
  public readonly cache: CacheMeta;

  constructor(options: BaseEventOptions) {
    this.pkg_name = options.pkg_name;
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
