import watcher from '@parcel/watcher';
import {
  DeletedAsset,
  FileAsset
} from '../asset';
import {
  DirectoryPath,
  FilePath,
  Reporter,
} from '../types';

export class IgnorerService implements Reporter {
  private ignoreMap: Map<DirectoryPath, Set<FilePath>>;

  constructor() {
    this.ignoreMap = new Map();
  }

  private onAsset(asset: FileAsset | DeletedAsset) {
    const entry = asset.event.entry;
    let set = this.ignoreMap.get(entry);

    if (!set) {
      set = new Set();
    }

    set.add(asset.distPath);
    set.add(asset.distPath.concat('.map'));

    this.ignoreMap.set(entry, set);
  }

  public onBuilt(task: string, asset: FileAsset) {
    this.onAsset(asset);
  }

  public onDeleted(task: string, asset: DeletedAsset) {
    this.onAsset(asset);
  }

  public getEventFilter(entry: DirectoryPath) {
    const set = this.ignoreMap.get(entry);

    if (!set) {
      return (event: watcher.Event) => true;
    } else {
      return (event: watcher.Event) => !set.has(event.path);
    }
  }
}
