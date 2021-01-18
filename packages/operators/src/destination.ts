import path from 'path';
import {
  pipe,
  OperatorFunction
} from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Asset,
  AssetStatus
} from '@yalam/core';

interface DestinationOptions {
  path: string;
}

/**
 * @description
 * An operator that converts source assets into artifact assets and append a path to them.
 */
export const destination = (options: DestinationOptions): OperatorFunction<Asset, Asset> => pipe(
  map(asset => {
    if (asset.status === AssetStatus.SOURCE
      || asset.status === AssetStatus.ARTIFACT) {
      return asset.getWithPath({
        status: AssetStatus.ARTIFACT,
        path: path.join(options.path, asset.path)
      });
    }
    else if (asset.status === AssetStatus.DELETED) {
      return asset.getWithPath(path.join(options.path, asset.path));
    }
    return asset;
  })
);
