import { Observable } from 'rxjs';
import { Asset } from './asset';

export type Task = (input: Observable<Event>) => Observable<Asset>;

export interface AsyncSubscription {
  unsubscribe(): Promise<void>;
}

type FilePath = string;

export interface ErrorEvent {
  event: FileEvent;
  error: Error;
}

export const enum EventType {
  ASSET,
  DELETED,
  INITIAL,
  UPDATED,
};

export interface DeletedEvent {
  type: EventType.DELETED;
  entry: string;
  path: FilePath;
}

export interface InitialEvent {
  type: EventType.INITIAL;
  path: FilePath;
}


export interface UpdatedEvent {
  type: EventType.UPDATED;
  entry: string;
  path: FilePath;
}

export type FileEvent = UpdatedEvent | DeletedEvent;

export type Event = InitialEvent | FileEvent;

export interface Reporter {
  onInput: (events: Event[]) => void;
  onBuilt: (asset: Asset) => void;
  onError: (event: ErrorEvent) => void;
  onIdle: () => void;
}
