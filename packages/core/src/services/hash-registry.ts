import { inject } from "@loopback/context";

import {
  GetHashOptions,
  IHashRegistry,
  IHashGenerator
} from "../interfaces";
import {
  CoreBindings,
} from "../keys";
import {
  DirectoryPath
} from "../types";

export class HashRegistry implements IHashRegistry {
  private hashes: Map<DirectoryPath, string>;

  constructor(
    @inject(CoreBindings.HASH_GENERATOR) private generator: IHashGenerator,
    @inject(CoreBindings.VERSION) private version: string,
    @inject(CoreBindings.CACHE_KEY) private cacheKey: string,
  ) {
    this.hashes = new Map();
  }

  private getKey(options: GetHashOptions) {
    let key = options.entry;

    if (options.task) {
      key = key.concat(options.task)
    }

    if (options.useCacheKey) {
      key = key.concat(this.version)
        .concat(this.cacheKey);
    }

    return key;
  }

  public async getResult(options: GetHashOptions) {
    const key = this.getKey(options);
    let hash = this.hashes.get(key);

    if (!hash) {
      hash = await this.generator.hash(key)
      this.hashes.set(key, hash);
    }

    return hash;
  }
}
