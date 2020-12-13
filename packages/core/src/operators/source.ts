import fs from 'fs/promises';
import {
  from,
  pipe,
  OperatorFunction
} from 'rxjs';
import {
  map,
  mergeAll
} from 'rxjs/operators';
import tinyGlob from 'tiny-glob/sync';

import {
  Asset,
  Event,
  EventType
} from '../core';

interface SourceOptions {
  glob: string;
}

const getInitialEvents = (glob: string, entry: string): Event[] => {
  const files = tinyGlob(
    glob,
    {
      cwd: entry,
      filesOnly: true,
      absolute: true
    }
  );
  return files.map(path => ({
    type: EventType.UPDATE,
    path,
  }))
};

const getAsset = async (filePath: string) => {
  const buffer = await fs.readFile(filePath);
  return new Asset({
    filePath,
    contents: buffer
  })
}

const getDeletedAsset = async (filePath: string) => new Asset({
  filePath,
  contents: Buffer.alloc(0)
})

export const source = (options: SourceOptions): OperatorFunction<Event, Asset> => pipe(
  map(event => {
    switch (event.type) {
      case EventType.ENTRY:
        return from(getInitialEvents(options.glob, event.path));
      default:
        return from([event]);
    }
  }),
  mergeAll(),
  map(event => {
    switch (event.type) {
      case EventType.UPDATE:
        return from(getAsset(event.path));
      default:
        return from(getDeletedAsset(event.path))
    }
  }),
  mergeAll()
)
