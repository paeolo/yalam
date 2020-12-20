import path from 'path';
import {
  pipe,
  OperatorFunction
} from 'rxjs';
import { map } from 'rxjs/operators';

import {
  Asset,
  AssetType
} from '../core';

interface DestinationOptions {
  path: string;
}

export const destination = (options: DestinationOptions): OperatorFunction<Asset, Asset> => pipe(
  map(asset => {
    const artifact = asset;
    artifact.type = asset.type !== AssetType.DELETED
      ? AssetType.ARCTIFACT
      : AssetType.DELETED;
    artifact.path = path.join(options.path, artifact.path);
    return artifact;
  })
);
