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
  ImmutableAsset,
  AssetStatus,
  FileAsset,
  SourceMap,
  ErrorAsset,
  EventType,
  FilePath,
} from '@yalam/core';

export interface OneToOneResult {
  contents?: Buffer;
  sourceMap?: SourceMap
}

interface TransformOptions {
  getResult: (asset: FileAsset) => Promise<OneToOneResult>;
  getPath: (path: FilePath) => string;
  filter?: (asset: ImmutableAsset) => boolean;
}

const alwaysTrue = (asset: Asset) => true;
const filterNullish = <T>() => filter(x => x != null) as OperatorFunction<T | null | undefined, T>;

const transformAsset = async (asset: Asset, options: TransformOptions): Promise<Asset | undefined> => {
  if (asset.status === AssetStatus.ARTIFACT
    || asset.status === AssetStatus.ERROR) {
    return asset;
  }

  const path = options.getPath(asset.path);

  if (asset.status === AssetStatus.DELETED) {
    return asset.getWithPath(path);
  }

  try {
    const result = await options.getResult(asset);
    if (result.contents) {
      return asset.getTransformed({
        path,
        contents: result.contents,
        sourceMap: result.sourceMap,
      });
    }
  } catch (error) {
    if (asset.event.type !== EventType.INITIAL) {
      return new ErrorAsset({
        event: asset.event,
        error,
      });
    }
    else {
      throw error;
    }
  }
}

/**
 * @description
 * An operator that transforms one asset into another with filtering and failure handling.
 */
export const oneToOne = (options: TransformOptions): OperatorFunction<Asset, Asset> => pipe(
  filter(options.filter || alwaysTrue),
  map((asset) => from(transformAsset(asset, options))),
  mergeAll(),
  filterNullish()
);
