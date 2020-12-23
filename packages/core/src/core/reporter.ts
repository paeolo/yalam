import PQueue from 'p-queue';

import {
  Asset,
  AssetType
} from './asset';
import { Event } from './types';

const supportsEmoji =
  process.platform !== 'win32' || process.env.TERM === 'xterm-256color';

export const SUCCESS: string = supportsEmoji ? '✨' : '√';
export const ERROR: string = supportsEmoji ? '🚨' : '×';

export class Reporter {
  private processing = false;
  private count = 0;
  private startTime: number | null = null;

  constructor(queue: PQueue) {
    queue.on('idle', this.onIdle.bind(this));
  }

  public onAdded(events: Event[]) {
    if (!this.processing && events.length !== 0) {
      this.processing = true;
      this.startTime = new Date().getTime();
    }
  }

  public onBuilt(asset: Asset) {
    if (asset.type === AssetType.ARTIFACT) {
      this.count += 1;
    }
  }

  private onIdle() {
    if (this.startTime && this.count > 0) {
      console.log(`${SUCCESS} Built in ${new Date().getTime() - this.startTime}ms`);
      this.count = 0;
      this.startTime = null;
    }
    this.processing = false;
  }
}
