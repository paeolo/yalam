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
import globrex from 'globrex';
import globParent from 'glob-parent';

import {
  Asset,
  Event,
  FileEvent,
  EventType,
  AssetType
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

const getSourceAsset = async (entry: string, path: string, fullPath: string,) => {
  const content = await fs.readFile(fullPath);
  const asset = new Asset({
    type: AssetType.SOURCE,
    path: path,
    entry,
  });
  asset.setContent(content);
  return asset;
};

const getDeletedAsset = async (entry: string, path: string) => new Asset({
  type: AssetType.DELETED,
  path,
  entry,
});

export const source = (options: SourceOptions): OperatorFunction<Event, Asset> => {
  let entry: string;
  const { regex } = globrex(options.glob, { globstar: true });
  const sourceBase = globParent(options.glob);

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
      const relativePath = path.relative(
        path.join(entry, sourceBase),
        event.path
      );
      switch (event.type) {
        case EventType.UPDATE:
          return from(getSourceAsset(
            entry,
            relativePath,
            event.path,
          ));
        case EventType.DELETE:
          return from(getDeletedAsset(
            entry,
            relativePath,
          ));
      }
    }),
    mergeAll()
  )
};
