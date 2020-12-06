export interface Asset {
  path: string;
}

export type Task = (input: Observable<Asset>) => Observable<Asset>;

export interface Observable<T> {
  subscribe(observer?: Observer<T>): Subscription;
  pipe(): Observable<T>;
  pipe(...operations: OperatorFunction<any, any>[]): Observable<any>;
}

export interface Observer<T> {
  closed?: boolean;
  next: (value: T) => void;
  error?: (err: any) => void;
  complete?: () => void;
}

export interface AsyncSubscription {
  unsubscribe(): Promise<void>;
}

export interface Subscription {
  unsubscribe(): void;
}

export interface UnaryFunction<T, R> {
  (source: T): R;
}

export interface OperatorFunction<T, R> extends UnaryFunction<Observable<T>, Observable<R>> {
}
