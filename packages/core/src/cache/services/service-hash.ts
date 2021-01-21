import {
  md5
} from '../utils';
import {
  DirectoryPath
} from "../../types";

interface HashServiceOptions {
  version: string;
  cacheKey: string;
}

interface GetHashOptions {
  entry: string;
  task?: string;
  useCacheKey?: boolean
}

export class HashService {
  private version: string;
  private cacheKey: string;
  private hashes: Map<DirectoryPath, string>;

  constructor(options: HashServiceOptions) {
    this.version = options.version;
    this.cacheKey = options.cacheKey;
    this.hashes = new Map();
  }

  public getHash(options: GetHashOptions) {
    let key = options.entry;

    if (options.task) {
      key = key.concat(options.task)
    }

    if (options.useCacheKey) {
      key = key
        .concat(this.version)
        .concat(this.cacheKey);
    }

    let hash = this.hashes.get(key)
    if (!hash) {
      hash = md5(key)
      this.hashes.set(key, hash);
    }
    return hash;
  }
}
