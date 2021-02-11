import path from 'path';
import {
  pipe,
  OperatorFunction,
  from,
} from 'rxjs';
import setImmediatePromise from 'set-immediate-promise';
import {
  map,
  filter,
  mergeAll
} from 'rxjs/operators';
import {
  Asset,
  AssetStatus,
  FileAsset,
  SourceMap,
  ErrorAsset,
  EventType,
  FileEvent,
  DeletedAsset,
  FilePath,
} from '@yalam/core';

export interface TransformEventResult {
  contents?: Buffer;
  sourceMap?: SourceMap
}

interface TransformOptions {
  getResult: (event: FileEvent) => Promise<TransformEventResult>;
  getPath: (path: FilePath) => string;
  filter?: (event: FileEvent) => boolean;
}

const alwaysTrue = (event: FileEvent) => true;
const filterNullish = <T>() => filter(x => x != null) as OperatorFunction<T | null | undefined, T>;

const transformAsset = async (event: FileEvent, options: TransformOptions): Promise<Asset | undefined> => {
  const base = event.sourceBase
    ? path.join(event.entry, event.sourceBase)
    : event.entry;

  const relativePath = path.relative(
    base,
    event.path
  );

  const outputPath = options.getPath(relativePath);

  if (event.type === EventType.DELETED) {
    return new DeletedAsset({
      event,
      path: outputPath
    })
  }

  try {
    await setImmediatePromise();
    const result = await options.getResult(event);
    if (result.contents) {
      return new FileAsset({
        status: AssetStatus.SOURCE,
        contents: result.contents,
        sourceMap: result.sourceMap,
        path: outputPath,
        event,
      })
    }
  } catch (error) {
    return new ErrorAsset({
      event,
      error,
    });
  }
}

/**
 * @description
 * An operator that transforms one file event into a file asset with filtering and failure handling.
 */
export const transformEvent = (options: TransformOptions): OperatorFunction<FileEvent, Asset> => pipe(
  filter(options.filter || alwaysTrue),
  map((asset) => from(transformAsset(asset, options))),
  mergeAll(),
  filterNullish()
);
