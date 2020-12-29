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
  AssetStatus
} from '@yalam/core';

interface TransformOptions {
  getPath: (asset: Asset) => string;
  getContents: (asset: Asset) => Promise<Buffer>;
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

  const contents = await options.getContents(asset);
  asset.path = path;
  asset.setContents(contents);
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
