import { Observable } from 'rxjs';
import {
  FileAsset,
  DeletedAsset,
  FailedAsset
} from './asset';

export type Asset = FileAsset | DeletedAsset | FailedAsset;
export type Task = (input: Observable<InputEvent>) => Observable<Asset>;

export interface AsyncSubscription {
  unsubscribe(): Promise<void>;
}

type FilePath = string;

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

export interface InitialEvent {
  type: EventType.INITIAL;
  path: FilePath;
}

export interface FileEvent {
  type: EventType.UPDATED | EventType.DELETED;
  entry: string;
  path: FilePath;
}

export type InputEvent = InitialEvent | FileEvent;

export interface Reporter {
  onInput?: (events: InputEvent[]) => void;
  onBuilt?: (asset: FileAsset, task: string) => void;
  onDeleted?: (asset: DeletedAsset) => void;
  onIdle?: (assets?: FailedAsset[]) => void;
}

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
}
