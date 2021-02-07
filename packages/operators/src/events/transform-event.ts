import {
  pipe,
  OperatorFunction,
  from,
} from 'rxjs';
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
} from '@yalam/core';

export interface TransformEventResult {
  contents?: Buffer;
  sourceMap?: SourceMap
}

interface TransformOptions {
  getResult: (event: FileEvent) => Promise<TransformEventResult>;
  getPath: (event: FileEvent) => string;
  filter?: (event: FileEvent) => boolean;
}

const alwaysTrue = (event: FileEvent) => true;
const filterNullish = <T>() => filter(x => x != null) as OperatorFunction<T | null | undefined, T>;

const transformAsset = async (event: FileEvent, options: TransformOptions): Promise<Asset | undefined> => {
  const path = options.getPath(event);

  if (event.type === EventType.DELETED) {
    return new DeletedAsset({
      event,
      path
    })
  }

  try {
    const result = await options.getResult(event);
    if (result.contents) {
      return new FileAsset({
        status: AssetStatus.SOURCE,
        contents: result.contents,
        sourceMap: result.sourceMap,
        path,
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
