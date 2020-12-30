import fsAsync from 'fs/promises';
import { AssetStatus } from '../types';

import {
  BaseAsset,
  BaseAssetOptions
} from './asset-base';

export class DeletedAsset extends BaseAsset {
  constructor(options: BaseAssetOptions) {
    super(options);
  }

  public get status(): AssetStatus.DELETED {
    return AssetStatus.DELETED;
  }

  public async commit() {
    await this.unlink();
    return this;
  }

  private async unlink() {
    try {
      await fsAsync.unlink(this.getFullPath());
      await fsAsync.unlink(this.getFullPath().concat('.map'));
    } catch { }
  }
}
