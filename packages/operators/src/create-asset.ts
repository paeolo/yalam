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
  AssetStatus,
  DeletedAsset,
  FileAsset,
  FileEvent,
  EventType,
} from '@yalam/core';

interface SourceAssetOptions {
  event: FileEvent,
  path: string,
};

const getSourceAsset = async (options: SourceAssetOptions) => new FileAsset({
  status: AssetStatus.SOURCE,
  path: options.path,
  event: options.event,
  contents: await fs.readFile(options.event.path)
});

/**
 * @description
 * An operator that buffers each file event into an immutable asset.
 */
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
        return from(
          getSourceAsset({
            path: relativePath,
            event: event,
          })
        );
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
