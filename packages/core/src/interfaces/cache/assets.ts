import {
  DeletedAsset,
  FileAsset
} from '../../assets';

export interface IAssetCache {
  onBuilt(asset: FileAsset): void;
  onDeleted(asset: DeletedAsset): void;
  sync(): Promise<boolean>;
  batchUpdate(): Promise<void>;
}
