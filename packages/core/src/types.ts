import { Observable } from 'rxjs';
import { Asset } from './asset';

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
  onInput: (event: InputEvent) => void;
  onBuilt: (asset: Asset) => void;
  onIdle: (events?: BuildError[]) => void;
}

export interface BuildError {
  event: FileEvent;
  error: Error;
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
