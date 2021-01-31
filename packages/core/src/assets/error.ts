import {
  FileEvent
} from '../events';
import {
  AssetStatus,
  FilePath
} from '../types';
import {
  ImmutableAsset,
} from './immutable';

type ErrorAssetOptions = {
  event: FileEvent;
  error: Error;
};

export class ErrorAsset extends ImmutableAsset {
  public readonly event: FileEvent;
  public readonly error: Error;

  constructor(options: ErrorAssetOptions) {
    super({
      path: options.event.path,
      event: options.event,
    });
    this.event = options.event;
    this.error = options.error;
  }

  public get status(): AssetStatus.ERROR {
    return AssetStatus.ERROR;
  }

  public get sourcePath(): FilePath {
    return this.event.path;
  }

  public async commit() {
    return this;
  }
}
