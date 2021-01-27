import watcher from '@parcel/watcher';

import {
  ErrorAsset,
} from '../../assets';
import {
  InputEvent
} from '../../types'

export interface IErrorCache {
  getEvents(): Promise<watcher.Event[]>;
  onInput(events: InputEvent[]): void;
  onError(error: ErrorAsset): void;
  batchUpdate(): Promise<void>;
}
