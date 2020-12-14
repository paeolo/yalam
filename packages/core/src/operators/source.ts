import fs from 'fs/promises';
import path from 'path';
import {
  from,
  pipe,
  OperatorFunction
} from 'rxjs';
import {
  filter,
  map,
  mergeAll,
  skipWhile
} from 'rxjs/operators';
import tinyGlob from 'tiny-glob/sync';
import globrex from 'globrex'

import {
  Asset,
  Event,
  FileEvent,
  EventType
} from '../core';

interface SourceOptions {
  glob: string;
}

const getInitialEvents = (glob: string, entry: string): FileEvent[] => {
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

export const source = (options: SourceOptions): OperatorFunction<Event, Asset> => {
  let entry: string;
  const { regex } = globrex(options.glob, { globstar: true });

  return pipe(
    skipWhile(event => {
      if (event.type === EventType.ENTRY) {
        entry = event.path;
      }
      return event.type !== EventType.ENTRY
    }),
    filter(event => event.type === EventType.ENTRY
      || regex.test(path.relative(entry, event.path))
    ),
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
        case EventType.DELETE:
          return from(getDeletedAsset(event.path))
      }
    }),
    mergeAll()
  )
}
