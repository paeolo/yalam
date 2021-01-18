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

export class HashService {
  private version: string;
  private cacheKey: string;
  private hashes: Map<DirectoryPath, string>;

  constructor(options: HashServiceOptions) {
    this.version = options.version;
    this.cacheKey = options.cacheKey;
    this.hashes = new Map();
  }

  public getHashForEntry(entry: string) {
    const key = entry
      .concat(this.version)
      .concat(this.cacheKey);

    let hash = this.hashes.get(key)
    if (!hash) {
      hash = md5(key)
      this.hashes.set(key, hash);
    }
    return hash;
  }

  public getGenericHashForEntry(entry: string) {
    let hash = this.hashes.get(entry)
    if (!hash) {
      hash = md5(entry);
      this.hashes.set(entry, hash);
    }
    return hash;
  }
}
