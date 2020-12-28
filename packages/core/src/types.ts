import { Observable } from 'rxjs';
import { Asset } from './asset';

export type Task = (input: Observable<InputEvent>) => Observable<Asset>;

export interface AsyncSubscription {
  unsubscribe(): Promise<void>;
}

type FilePath = string;

export const enum EventType {
  INITIAL,
  UPDATE,
  DELETE
};

export interface InitialEvent {
  type: EventType.INITIAL;
  path: FilePath;
}

export interface FileEvent {
  type: EventType.UPDATE | EventType.DELETE;
  entry: string;
  path: FilePath;
}

export type InputEvent = InitialEvent | FileEvent;

export type JSONValue =
  | null
  | boolean
  | number
  | string
  | Array<JSONValue>;

export interface Reporter {
  onIdle: () => void;
  onAdded: (events: InputEvent[]) => void;
  onBuilt: (asset: Asset) => void;
}
