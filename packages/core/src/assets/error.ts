import { FileEvent } from '../events';
import { AssetStatus } from '../types';
import {
  ImmutableAsset,
  ImmutableAssetOptions
} from './immutable';

type ErrorAssetOptions = {
  event: FileEvent;
  error: Error;
} & ImmutableAssetOptions;

export class ErrorAsset extends ImmutableAsset {
  public readonly event: FileEvent;
  public readonly error: Error;

  constructor(options: ErrorAssetOptions) {
    super(options);
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
