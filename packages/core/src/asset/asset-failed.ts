import { AssetStatus } from '../types';

import {
  BaseAsset,
  BaseAssetOptions
} from './asset-base';
import { FileAsset } from './asset-file';

type FailedAssetOptions = {
  error: Error;
} & BaseAssetOptions;

export class FailedAsset extends BaseAsset {

  static from(asset: FileAsset, error: Error) {
    return new FailedAsset({
      event: asset.getEvent(),
      path: asset.path,
      error
    })
  }

  private error: Error;

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

  public getError() {
    return this.error;
  }
}
