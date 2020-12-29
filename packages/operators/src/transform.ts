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
  AssetStatus,
  SourceMap
} from '@yalam/core';

interface TransformResult {
  contents: Buffer;
  sourceMap?: SourceMap
}

interface TransformOptions {
  getPath: (asset: Asset) => string;
  getResult: (asset: Asset) => Promise<TransformResult>;
  filter?: (asset: Asset) => boolean;
}

const handleAsset = async (asset: Asset, options: TransformOptions) => {
  if (asset.status === AssetStatus.ARTIFACT) {
    return asset;
  }

  const path = options.getPath(asset);

  if (asset.status === AssetStatus.DELETED) {
    asset.path = path;
    return asset;
  }

  const result = await options.getResult(asset);
  asset.path = path;
  asset.setContents(result.contents);
  if (result.sourceMap) {
    asset.sourceMap = result.sourceMap;
  }
  return asset;
}

export const transform = (options: TransformOptions): OperatorFunction<Asset, Asset> => pipe(
  filter((asset => {
    if (!options.filter) {
      return true;
    }
    return options.filter(asset);
  })),
  map((asset) => from(handleAsset(asset, options))),
  mergeAll()
);
