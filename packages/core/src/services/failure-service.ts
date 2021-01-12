import watcher from '@parcel/watcher';
import isSubdir from 'is-subdir';
import path from 'path';
import {
  FailedAsset,
} from '../asset';
import {
  DirectoryPath,
} from '../types';

export class FailureService {
  private failures: FailedAsset[];

  constructor() {
    this.failures = [];
  }

  public onFailedAsset(asset: FailedAsset) {
    if (!this.failures.some(
      value => value.event.path === asset.event.path
    ))
      this.failures.push(asset);
  }

  public clear(entry: DirectoryPath) {
    this.failures = this.failures.filter(
      asset => !isSubdir(entry, path.dirname(asset.event.path))
    );
  }

  public getFailures() {
    return this.failures;
  }

  public getEvents(entry: DirectoryPath): watcher.Event[] {
    return this.failures
      .filter(asset => isSubdir(entry, path.dirname(asset.event.path)))
      .map(asset => ({
        type: 'update',
        path: asset.event.path
      }));
  }
}
