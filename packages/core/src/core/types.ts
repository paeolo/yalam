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

export interface Event {
  type: EventType;
  path: FilePath;
}
