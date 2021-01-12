import watcher from '@parcel/watcher';
import {
  DeletedAsset,
  FileAsset
} from '../asset';
import {
  DirectoryPath,
  FilePath,
} from '../types';

export class FileEventIgnorer {
  private ignoreMap: Map<DirectoryPath, Set<FilePath>>;

  constructor() {
    this.ignoreMap = new Map();
  }

  public onFileAsset(asset: FileAsset | DeletedAsset) {
    const entry = asset.event.entry;
    const ignoreSet = this.ignoreMap.get(entry) || new Set();

    ignoreSet.add(asset.fullPath);
    ignoreSet.add(asset.fullPath.concat('.map'));
    this.ignoreMap.set(entry, ignoreSet);
  }

  public getEventFilter(entry: DirectoryPath) {
    const ignoreSet = this.ignoreMap.get(entry) || new Set();
    return (event: watcher.Event) => !ignoreSet.has(event.path)
  }
}
