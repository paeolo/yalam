import fsAsync from 'fs/promises';
import { AssetStatus } from '../types';

import {
  ImmutableAsset,
  ImmutableAssetOptions
} from './asset-immutable';

export class DeletedAsset extends ImmutableAsset {
  constructor(options: ImmutableAssetOptions) {
    super(options);
  }

  public get status(): AssetStatus.DELETED {
    return AssetStatus.DELETED;
  }

  public getWithPath(path: FilePath) {
    return new DeletedAsset({
      event: this.event,
      path
    });
  }

  public async commit() {
    await this.unlink();
    return this;
  }

  private async unlink() {
    try {
      await fsAsync.unlink(this.fullPath);
      await fsAsync.unlink(this.fullPath.concat('.map'));
    } catch { }
  }
}
