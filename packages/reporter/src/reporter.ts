import {
  Asset,
  AssetType,
  Event,
  Yalam
} from '@yalam/core';

const supportsEmoji =
  process.platform !== 'win32' || process.env.TERM === 'xterm-256color';

const SUCCESS: string = supportsEmoji ? '✨' : '√';
const ERROR: string = supportsEmoji ? '🚨' : '×';

export class Reporter {
  private processing = false;
  private startTime: number | null = null;
  private count = 0;

  constructor(yalam: Yalam) {
    yalam.on('added', this.onAdded.bind(this));
    yalam.on('built', this.onBuilt.bind(this));
    yalam.on('idle', this.onIdle.bind(this));
  }

  public onAdded(events: Event[]) {
    if (!this.processing
      && events.length !== 0
    ) {
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
    }
    this.count = 0;
    this.processing = false;
  }
}
