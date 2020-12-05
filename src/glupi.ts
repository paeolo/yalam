import path from 'path';
import watcher from '@parcel/watcher';
import Undertaker from 'undertaker';

import {
  AsyncSubscription
} from './types';
import {
  normalizeOptions,
  getSnapshotPath
} from './utils';

export interface GlupiOptions {
  entries: string[];
  disableCache?: boolean;
  cacheDir?: string;
}

export default class Glupi extends Undertaker {
  private options: Required<GlupiOptions>;

  constructor(options: GlupiOptions) {
    super();
    this.options = normalizeOptions(options);
  }

  public async build() {
  }

  public async watch(): Promise<AsyncSubscription> {
    const input = this.options.entries[0];
    console.log(getSnapshotPath(this.options.cacheDir))
    const events = await watcher.getEventsSince(
      input,
      getSnapshotPath(this.options.cacheDir)
    )

    console.log(events);

    const subscription = await watcher.subscribe(
      input,
      (err, events) => { console.log(events); },
      { ignore: ['node_modules'] }
    );

    return {
      unsubscribe: async () => {
        await subscription.unsubscribe();
        await watcher.writeSnapshot(
          input,
          getSnapshotPath(this.options.cacheDir));
      }
    };
  }
}
