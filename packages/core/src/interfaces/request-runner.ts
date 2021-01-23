import {
  AsyncSubscription
} from '../types';

export interface IRequestRunner {
  build(): Promise<void>;
  watch(): Promise<AsyncSubscription>;
}
