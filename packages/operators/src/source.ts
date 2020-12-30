import fs from 'fs/promises';
import path from 'path';
import {
  from,
  of,
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
  DeletedAsset,
  FileAsset,
  InputEvent,
  FileEvent,
  EventType,
} from '@yalam/core';

interface SourceOptions {
  glob: string;
};

interface SourceAssetOptions {
  event: FileEvent,
  path: string,
  fullPath: string;
};

const getEvents = (glob: string, entry: string): FileEvent[] => {
  const files = tinyGlob(
    glob,
    {
      cwd: entry,
      filesOnly: true,
      absolute: true
    }
  );
  return files.map(path => ({
    type: EventType.UPDATED,
    entry,
    path,
  }))
};

const getSourceAsset = async (options: SourceAssetOptions) => {
  const content = await fs.readFile(options.fullPath);

  const asset = new FileAsset({
    path: options.path,
    event: options.event,
  });

  asset.setContents(content);
  return asset;
};

export const source = (options: SourceOptions): OperatorFunction<InputEvent, Asset> => {
  const { regex } = globrex(options.glob, { globstar: true });
  const sourceBase = globParent(options.glob);

  return pipe(
    filter(event => event.type === EventType.INITIAL
      || regex.test(path.relative(event.entry, event.path))
    ),
    map(event => {
      switch (event.type) {
        case EventType.INITIAL:
          return from(getEvents(options.glob, event.path));
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
        case EventType.UPDATED:
          return from(getSourceAsset({
            event: event,
            path: relativePath,
            fullPath: event.path,
          }));
        case EventType.DELETED:
          return of(
            new DeletedAsset({
              path: relativePath,
              event: event
            })
          );
      }
    }),
    mergeAll()
  )
};
