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
} from '@yalam/core';

export interface OneToOneResult {
  contents?: Buffer;
  sourceMap?: SourceMap
}

interface TransformOptions {
  getResult: (asset: FileAsset) => Promise<OneToOneResult>;
  getPath: (asset: ImmutableAsset) => string;
  filter?: (asset: ImmutableAsset) => boolean;
}

const filterNullish = <T>() => filter(x => x != null) as OperatorFunction<T | null | undefined, T>;

const transformAsset = async (asset: Asset, options: TransformOptions): Promise<Asset | undefined> => {
  if (asset.status === AssetStatus.ARTIFACT
    || asset.status === AssetStatus.ERROR) {
    return asset;
  }

  const path = options.getPath(asset);

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
  filter((asset => {
    if (options.filter) {
      return options.filter(asset);
    } else {
      return true;
    }
  })),
  map((asset) => from(transformAsset(asset, options))),
  mergeAll(),
  filterNullish()
);
