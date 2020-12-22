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
};

interface SourceAssetOptions {
  event: FileEvent,
  path: string,
  fullPath: string;
};

interface DeletedAssetOptions {
  event: FileEvent,
  path: string,
};

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
    entry,
    path,
  }))
};

const getSourceAsset = async (options: SourceAssetOptions) => {
  const content = await fs.readFile(options.fullPath);
  const asset = new Asset({
    type: AssetType.SOURCE,
    path: options.path,
    event: options.event,
  });
  asset.setContent(content);
  return asset;
};

const getDeletedAsset = async (options: DeletedAssetOptions) => new Asset({
  type: AssetType.DELETED,
  path: options.path,
  event: options.event
});

export const source = (options: SourceOptions): OperatorFunction<Event, Asset> => {
  const { regex } = globrex(options.glob, { globstar: true });
  const sourceBase = globParent(options.glob);

  return pipe(
    filter(event => event.type === EventType.INITIAL
      || regex.test(path.relative(event.entry, event.path))
    ),
    map(event => {
      switch (event.type) {
        case EventType.INITIAL:
          return from(getInitialEvents(options.glob, event.path));
        default:
          return from([event]);
      }
    }),
    mergeAll(),
    map(event => {
      const relativePath = path.relative(
        path.join(event.entry, sourceBase),
        event.path
      );
      switch (event.type) {
        case EventType.UPDATE:
          return from(getSourceAsset({
            event: event,
            path: relativePath,
            fullPath: event.path,
          }));
        case EventType.DELETE:
          return from(getDeletedAsset({
            event: event,
            path: relativePath,
          }));
      }
    }),
    mergeAll()
  )
};
