import {
  DeletedAsset,
  FileAsset
} from "../../assets";
import {
  IAssetCache
} from "../../interfaces";

export class AssetCache implements IAssetCache {
  public async onBuilt(asset: FileAsset) {

  }
  public async onDeleted(asset: DeletedAsset) {

  }
  public async sync() {
    return false;
  }

  public async batchUpdate() {

  }
}
