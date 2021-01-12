import mkdirp from 'mkdirp';
import path from 'path';
import {
  EventType,
  DirectoryPath
} from "../types";
import { CACHE_NAME } from '../cache'

export interface BaseEventOptions {
  entry: DirectoryPath;
  cacheDir: DirectoryPath;
  cacheKey: string;
}

export abstract class ImmutableEvent {
  public readonly entry: DirectoryPath;
  public readonly cacheDir: DirectoryPath;
  public readonly cacheKey: string;

  constructor(options: BaseEventOptions) {
    this.entry = options.entry;
    this.cacheDir = options.cacheDir;
    this.cacheKey = options.cacheKey;
  }

  public abstract get type(): EventType;

  public getCachePath(cacheName: string): DirectoryPath {
    if (cacheName === CACHE_NAME) {
      throw new Error(
        `Cache name "${CACHE_NAME}" is reserved`
      );
    }

    const cachePath = path.join(
      this.cacheDir,
      cacheName,
      this.cacheKey
    );

    mkdirp.sync(cachePath);
    return cachePath;
  }
}
