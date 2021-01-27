import fsAsync from 'fs/promises';
import path from 'path';
import { inject } from '@loopback/context';
import watcher from '@parcel/watcher';

import {
  ErrorAsset
} from '../../assets';
import {
  IErrorCache
} from "../../interfaces";
import {
  CacheBindings
} from '../../keys';
import {
  DirectoryPath,
  InputEvent,
  FilePath,
  EventType
} from '../../types'

const FILENAME = 'errors.json';

interface Error {
  sourcePath: FilePath;
}

export class ErrorCache implements IErrorCache {
  private filePath: FilePath;
  private events: InputEvent[];
  private errors: ErrorAsset[];

  constructor(
    @inject(CacheBindings.REQUEST_CACHE_DIR) private requestCacheDir: DirectoryPath,
  ) {
    this.filePath = path.join(
      this.requestCacheDir,
      FILENAME
    );
    this.events = [];
    this.errors = [];
  }

  private async getErrors(): Promise<Error[]> {
    try {
      return JSON.parse(
        (await fsAsync.readFile(this.filePath))
          .toString()
      )
    } catch {
      return [];
    }
  }

  private async writeErrors(assets: Error[]) {
    return fsAsync.writeFile(
      this.filePath,
      JSON.stringify(assets, undefined, 2)
    );
  }

  public async getEvents(): Promise<watcher.Event[]> {
    return (await this.getErrors())
      .map(error => ({
        type: 'update',
        path: error.sourcePath,
      }));
  }

  public onInput(events: InputEvent[]) {
    this.events.push(...events);
  }

  public onError(error: ErrorAsset) {
    this.errors.push(error);
  }

  public async batchUpdate() {
    let errors = await this.getErrors();

    this.events.forEach((event) => {
      if (event.type === EventType.INITIAL) {
        this.errors = [];
      }
      else {
        errors = errors
          .filter((error) => !(error.sourcePath === event.path));
      }
    });

    this.errors.forEach((error) => {
      if (!errors.some((value) => value.sourcePath === error.sourcePath)) {
        errors.push({
          sourcePath: error.sourcePath
        });
      }
    });

    this.events = [];
    this.errors = [];
    await this.writeErrors(errors);
  }
}
