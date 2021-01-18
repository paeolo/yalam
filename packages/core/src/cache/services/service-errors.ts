import watcher from '@parcel/watcher';
import fsAsync from 'fs/promises';
import PMap from 'p-map';
import path from 'path';

import {
  lockFileAsync,
  unlockFileAsync
} from '../../utils';
import {
  ErrorAsset,
} from "../../asset";
import {
  DirectoryPath,
  Reporter,
  InputEvent,
  EventType
} from "../../types";
import {
  HashService
} from './service-hash';
import {
  EventWithEntry
} from './service-fs';
import { CACHE_NAME } from "../../constants";

const FILE_PREFIX = 'errors';

interface OnDiskError {
  task: string;
  sourcePath: FilePath;
}

interface ErrorServiceOptions {
  cacheDir: DirectoryPath;
  hashes: HashService;
}

export class ErrorService implements Reporter {
  private cacheDir: DirectoryPath;
  private hashes: HashService;
  private eventsMap: Map<string, InputEvent[]>;
  private errorsMap: Map<string, ErrorAsset[]>;
  private entries: Set<string>;

  constructor(options: ErrorServiceOptions) {
    this.cacheDir = options.cacheDir;
    this.hashes = options.hashes;
    this.eventsMap = new Map();
    this.errorsMap = new Map();
    this.entries = new Set();
  }

  private getEntries(): DirectoryPath[] {
    return Array.from(this.entries);
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
      .concat(this.hashes.getHashForEntry(entry))
      .concat('.json');

    return path.join(
      this.cacheDir,
      CACHE_NAME,
      fileName,
    );
  }

  private async getErrors(entry: DirectoryPath): Promise<OnDiskError[]> {
    try {
      return JSON.parse(
        (await fsAsync.readFile(this.getCacheFilePath(entry)))
          .toString()
      );
    } catch {
      return [];
    }
  }

  private async writeErrors(entry: DirectoryPath, errors: OnDiskError[]) {
    return fsAsync.writeFile(
      this.getCacheFilePath(entry),
      JSON.stringify(errors, undefined, 2)
    );
  }

  private async getEventsForEntry(task: string, entry: DirectoryPath): Promise<watcher.Event[]> {
    return (await this.getErrors(entry))
      .filter((value) => value.task === task)
      .map((value) => ({
        type: 'update',
        path: value.sourcePath
      }));
  }

  private async updateEntry(entry: DirectoryPath) {
    let onDisk = await this.getErrors(entry);

    this.eventsMap.forEach(
      (events, task) => events.forEach(
        (event) => {
          if (event.type === EventType.INITIAL) {
            onDisk = onDisk.filter(
              (error) => !(error.task === task && entry === event.entry)
            );
          }
          else {
            onDisk = onDisk.filter(
              (error) => !(error.task === task && error.sourcePath === event.path)
            );
          }
        }
      )
    );

    this.errorsMap.forEach(
      (errors, task) => errors.forEach(
        (error) => {
          if (error.entry === entry
            && !onDisk.some(
              (value) => value.task === task && value.sourcePath === error.sourcePath
            )) {
            onDisk.push({
              task,
              sourcePath: error.sourcePath
            });
          }
        }
      )
    );

    await this.writeErrors(entry, onDisk);
  }

  public onInput(task: string, events: InputEvent[]) {
    const input = this.eventsMap.get(task) || [];
    events.forEach((value) => {
      input.push(value)
      this.entries.add(value.entry)
    });
    this.eventsMap.set(task, events);
  }

  public onError(task: string, error: ErrorAsset) {
    const input = this.errorsMap.get(task) || [];
    input.push(error);
    this.entries.add(error.entry);
    this.errorsMap.set(task, input);
  }

  public async getEvents(task: string, entries: DirectoryPath[]) {
    const events: EventWithEntry[] = [];
    const lockFilePath = this.getLockFilePath();

    await lockFileAsync(lockFilePath);

    const addEvents = async (entry: DirectoryPath) => {
      const fileEvents = await this.getEventsForEntry(task, entry);
      events.push(
        ...fileEvents.map((event) => ({
          event,
          entry
        }))
      );
    };

    await PMap(entries, addEvents);
    await unlockFileAsync(lockFilePath);

    return events;
  }


  public async update() {
    const lockFilePath = this.getLockFilePath();
    const entries = this.getEntries().sort();
    await lockFileAsync(lockFilePath);

    await Promise.all(
      entries.map(entry => this.updateEntry(entry))
    );

    this.eventsMap.clear();
    this.errorsMap.clear();
    this.entries.clear();
    await unlockFileAsync(lockFilePath);
  }
}
