import { inject } from '@loopback/context';

import {
  AsyncSubscription,
  DirectoryPath,
  Task
} from '../types';
import {
  IRequestRunner
} from "../interfaces";
import {
  RequestBindings
} from '../keys';

export class RequestRunner implements IRequestRunner {
  constructor(
    @inject(RequestBindings.TASK_NAME) private task: string,
    @inject(RequestBindings.TASK_FN) private fn: Task,
    @inject(RequestBindings.ENTRY) private entry: DirectoryPath,
    @inject(RequestBindings.CACHE_KEY) private cacheKey: string,
  ) { }

  public async build() {
  }

  public async watch(): Promise<AsyncSubscription> {
    return {
      unsubscribe: async () => { }
    }
  }
}
