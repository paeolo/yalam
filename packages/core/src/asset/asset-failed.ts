import { AssetStatus } from '../types';

import {
  ImmutableAsset,
  ImmutableAssetOptions
} from './asset-immutable';

type FailedAssetOptions = {
  error: Error;
} & ImmutableAssetOptions;

export class FailedAsset extends ImmutableAsset {
  public readonly error: Error;

  constructor(options: FailedAssetOptions) {
    super(options);
    this.error = options.error;
  }

  public get status(): AssetStatus.FAILED {
    return AssetStatus.FAILED;
  }

  public async commit() {
    return this;
  }
}
