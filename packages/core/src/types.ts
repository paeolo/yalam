import { Observable } from 'rxjs';
import {
  FileAsset,
  DeletedAsset,
  FailedAsset
} from './asset';
import {
  FileEvent,
  InitialEvent
} from './events';

export type Path = string;

export type InputEvent = InitialEvent | FileEvent;
export type Asset = FileAsset | DeletedAsset | FailedAsset;
export type Task = (input: Observable<InputEvent>) => Observable<Asset>;

export interface AsyncSubscription {
  unsubscribe(): Promise<void>;
};

export interface Reporter {
  onInput?: (events: InputEvent[]) => void;
  onBuilt?: (asset: FileAsset, task: string) => void;
  onDeleted?: (asset: DeletedAsset) => void;
  onIdle?: (assets?: FailedAsset[]) => void;
};

export const enum EventType {
  DELETED,
  INITIAL,
  UPDATED,
};

export const enum AssetStatus {
  SOURCE,
  ARTIFACT,
  DELETED,
  FAILED
};

export type SourceMap = {
  map: {
    version: number;
    sources: string[];
    names: string[];
    sourceRoot?: string;
    sourcesContent?: string[];
    mappings: string;
    file: string;
  };
  referencer: (path: string) => string
};
