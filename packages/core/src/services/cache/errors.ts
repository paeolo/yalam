import watcher from '@parcel/watcher';

import {
  ErrorAsset
} from '../../assets';
import {
  IErrorCache
} from "../../interfaces";
import {
  InputEvent
} from '../../types'

export class ErrorCache implements IErrorCache {
  public async getEvents(): Promise<watcher.Event[]> {
    return [];
  }

  public onInput(events: InputEvent[]) {

  }

  public onError(error: ErrorAsset) {

  }

  public async batchUpdate() {

  }
}
