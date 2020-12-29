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

export const destination = (options: DestinationOptions): OperatorFunction<Asset, Asset> => pipe(
  map(asset => {
    if (asset.status === AssetStatus.SOURCE) {
      asset.status = AssetStatus.ARTIFACT;
    }
    asset.path = path.join(options.path, asset.path);
    return asset;
  })
);
