import fs from 'fs/promises';
import path from 'path';
import {
  from,
  of,
  pipe,
  OperatorFunction
} from 'rxjs';
import {
  map,
  mergeAll,
} from 'rxjs/operators';
import {
  Asset,
  DeletedAsset,
  FileAsset,
  FileEvent,
  EventType,
} from '@yalam/core';

interface SourceAssetOptions {
  event: FileEvent,
  path: string,
  fullPath: string;
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

export const createAsset = (): OperatorFunction<FileEvent, Asset> => pipe(
  map(event => {
    const base = event.sourceBase
      ? path.join(event.entry, event.sourceBase)
      : event.entry;

    const relativePath = path.relative(
      base,
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
            event: event,
          })
        );
    }
  }),
  mergeAll()
)
