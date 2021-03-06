import { Observable } from 'rxjs';
import {
  DeletedAsset,
  FileAsset,
  ErrorAsset
} from './assets';
import {
  FileEvent,
  InitialEvent
} from './events';

export type FilePath = string;
export type DirectoryPath = string;
export type Path = FilePath | DirectoryPath;

export type InputEvent = InitialEvent
  | FileEvent;
export type Asset = DeletedAsset
  | ErrorAsset
  | FileAsset;
export type Operator = (input: Observable<InputEvent>) => Observable<Asset>;

export interface AsyncSubscription {
  unsubscribe(): Promise<void>;
};

export interface Reporter {
  onInput?: (pipeline: string, events: InputEvent[]) => void;
  onBuilt?: (pipeline: string, asset: FileAsset) => void;
  onDeleted?: (pipeline: string, asset: DeletedAsset) => void;
  onIdle?: (errors: ErrorAsset[]) => void;
};

export const enum EventType {
  DELETED,
  INITIAL,
  UPDATED,
};

export const enum AssetStatus {
  ARTIFACT,
  DELETED,
  ERROR,
  SOURCE,
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
  referencer?: (path: string) => string
};
