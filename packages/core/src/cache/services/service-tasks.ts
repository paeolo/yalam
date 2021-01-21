import fsAsync from 'fs/promises';
import path from 'path';

import {
  lockFileAsync,
  unlockFileAsync
} from '../../utils';
import {
  DirectoryPath,
} from "../../types";
import { HashService } from './service-hash';
import { CACHE_NAME } from "../../constants";

const FILE_PREFIX = 'tasks';

interface AssetServiceOptions {
  cacheDir: DirectoryPath;
  hashes: HashService;
}

export class TaskService {
  private cacheDir: DirectoryPath;
  private hashes: HashService;

  constructor(options: AssetServiceOptions) {
    this.cacheDir = options.cacheDir;
    this.hashes = options.hashes;
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
      .concat(this.hashes.getHash({
        entry,
        useCacheKey: true
      }))
      .concat('.json');

    return path.join(
      this.cacheDir,
      CACHE_NAME,
      fileName,
    );
  }

  private async getTasks(entry: DirectoryPath): Promise<string[]> {
    try {
      return JSON.parse(
        (await fsAsync.readFile(this.getCacheFilePath(entry)))
          .toString()
      );
    } catch {
      return [];
    }
  }

  private async writeTasks(entry: DirectoryPath, tasks: string[]) {
    return fsAsync.writeFile(
      this.getCacheFilePath(entry),
      JSON.stringify(tasks, undefined, 2)
    );
  }

  private async updateEntry(task: string, entry: DirectoryPath) {
    let hasTask = true;
    let tasks = await this.getTasks(entry);
    const onDisk = tasks;

    if (!onDisk.some((value) => value === task)) {
      hasTask = false;
      onDisk.push(task);
      await this.writeTasks(entry, onDisk);
    }

    return {
      entry,
      hasTask
    };
  }


  public async update(task: string, entries: DirectoryPath[]) {
    const lockFilePath = this.getLockFilePath();
    await lockFileAsync(lockFilePath);

    const result = await Promise.all(
      entries.map(entry => this.updateEntry(task, entry))
    );

    await unlockFileAsync(lockFilePath);
    return result
      .filter((value) => !value.hasTask)
      .map((value) => value.entry)
  }
}
