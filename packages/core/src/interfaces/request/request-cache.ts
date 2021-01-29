import watcher from '@parcel/watcher';
import {
  DeletedAsset,
  ErrorAsset,
  FileAsset
} from '../../assets';
import {
  FileEvent
} from '../../events';
import {
  InputEvent
} from '../../types'

export interface IRequestCache {
  getInputEvents(): Promise<InputEvent[]>;
  onInput(events: InputEvent[]): void;
  onBuilt(asset: FileAsset): void;
  onDeleted(asset: DeletedAsset): void;
  onError(error: ErrorAsset): void;
  convertEvent(event: watcher.Event): FileEvent;
  batchUpdate(): Promise<void>;
}
