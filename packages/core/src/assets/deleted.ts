import fsAsync from 'fs/promises';

import {
  AssetStatus,
  FilePath,
} from '../types';
import {
  ImmutableAsset,
  ImmutableAssetOptions
} from './immutable';

export class DeletedAsset extends ImmutableAsset {
  constructor(options: ImmutableAssetOptions) {
    super(options);
  }

  public get status(): AssetStatus.DELETED {
    return AssetStatus.DELETED;
  }

  public getWithPath(path: FilePath) {
    return new DeletedAsset({
      path,
      event: this.event,
    });
  }

  public async commit() {
    try {
      await fsAsync.unlink(this.distPath);
      await fsAsync.unlink(this.distPath.concat('.map'));
    } catch { }
  }
}
