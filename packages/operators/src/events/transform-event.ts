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
};

export interface IEventTransformer {
  getResult: (event: FileEvent) => Promise<TransformEventResult>;
  getPath: (path: FilePath) => string;
};

interface TransformOptions {
  filter?: (event: FileEvent) => boolean;
  transformers: IEventTransformer[];
}

const alwaysTrue = (event: FileEvent) => true;
const filterNullish = <T>() => filter(x => x != null) as OperatorFunction<T | null | undefined, T>;

const transformAsset = async (event: FileEvent, options: TransformOptions): Promise<Asset[]> => {
  const base = event.sourceBase
    ? path.join(event.entry, event.sourceBase)
    : event.entry;

  const relativePath = path.relative(
    base,
    event.path
  );

  if (event.type === EventType.DELETED) {
    return options.transformers.map(transformer => new DeletedAsset({
      event,
      path: transformer.getPath(relativePath)
    }))
  }

  const assets: Asset[] = [];
  await setImmediatePromise();

  for (const transformer of options.transformers) {
    try {
      const result = await transformer.getResult(event);
      if (result.contents) {
        assets.push(new FileAsset({
          status: AssetStatus.SOURCE,
          contents: result.contents,
          sourceMap: result.sourceMap,
          path: transformer.getPath(relativePath),
          event,
        }))
      }
    } catch (error) {
      assets.push(new ErrorAsset({
        event,
        error,
      }));
    }
  }

  return assets;
}

/**
 * @description
 * An operator that transforms one file event into a file asset with filtering and failure handling.
 */
export const transformEvent = (options: TransformOptions): OperatorFunction<FileEvent, Asset> => pipe(
  filter(options.filter || alwaysTrue),
  map((asset) => from(transformAsset(asset, options))),
  mergeAll(),
  mergeAll(),
  filterNullish()
);
