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
  BaseAsset,
  AssetStatus,
  FileAsset,
  SourceMap,
  FailedAsset
} from '@yalam/core';

export interface OneToOneResult {
  contents: Buffer;
  sourceMap?: SourceMap
}

interface TransformOptions {
  getResult: (asset: FileAsset) => Promise<OneToOneResult>;
  getPath: (asset: BaseAsset) => string;
  filter?: (asset: BaseAsset) => boolean;
}

const handleAsset = async (asset: Asset, options: TransformOptions) => {
  if (asset.status === AssetStatus.ARTIFACT
    || asset.status === AssetStatus.FAILED) {
    return asset;
  }

  const path = options.getPath(asset);

  if (asset.status === AssetStatus.DELETED) {
    asset.path = path;
    return asset;
  }

  try {
    const result = await options.getResult(asset);
    asset.path = path;
    asset.setContents(result.contents);
    if (result.sourceMap) {
      asset.sourceMap = result.sourceMap;
    }
    return asset;
  } catch (error) {
    asset.path = path;
    return FailedAsset.from(asset, error);
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
