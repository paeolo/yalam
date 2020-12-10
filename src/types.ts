import stream from 'stream';
import { Observable } from 'rxjs';

export type Task = (input: Observable<Asset>) => Observable<Asset>;

export interface AsyncSubscription {
  unsubscribe(): Promise<void>;
}

export interface Asset {
  filePath: string;
  contents?: Buffer | stream.Readable;
}
