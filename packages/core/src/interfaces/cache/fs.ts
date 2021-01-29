import watcher from '@parcel/watcher';

export interface IFSCache {
  getEventsSince(): Promise<watcher.Event[]>;
  batchUpdate(): Promise<void>;
}
