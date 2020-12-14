import { Observable } from 'rxjs';
import { Asset } from './asset';

export type Task = (input: Observable<Event>) => Observable<Asset>;

export interface AsyncSubscription {
  unsubscribe(): Promise<void>;
}

type FilePath = string;

export const enum EventType {
  ENTRY,
  UPDATE,
  DELETE
};

export interface EntryEvent {
  type: EventType.ENTRY,
  path: FilePath
}

export interface FileEvent {
  type: EventType.UPDATE | EventType.DELETE,
  path: FilePath
}

export type Event = EntryEvent | FileEvent;
