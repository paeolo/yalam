import {
  pipe,
  OperatorFunction,
  from
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
} from '@yalam/core';

export interface OneToOneResult {
  contents: Buffer;
  sourceMap?: SourceMap
}

interface TransformOptions {
  getResult: (asset: FileAsset) => Promise<OneToOneResult>;
  getPath: (asset: ImmutableAsset) => string;
  filter?: (asset: ImmutableAsset) => boolean;
}

const handleAsset = async (asset: Asset, options: TransformOptions) => {
  if (asset.status === AssetStatus.ARTIFACT
    || asset.status === AssetStatus.FAILED) {
    return asset;
  }

  const path = options.getPath(asset);

  if (asset.status === AssetStatus.DELETED) {
    return asset.getWithPath(path);
  }

  try {
    const result = await options.getResult(asset);
    return asset.getTransformed({
      path,
      contents: result.contents,
      sourceMap: result.sourceMap,
    });
  } catch (error) {
    return asset.getFailed(path, error);
  }
}

export const oneToOne = (options: TransformOptions): OperatorFunction<Asset, Asset> => pipe(
  filter((asset => {
    if (!options.filter) {
      return true;
    }
    return options.filter(asset);
  })),
  map((asset) => from(handleAsset(asset, options))),
  mergeAll()
);