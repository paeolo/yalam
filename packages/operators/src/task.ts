import isPromise from 'is-promise';
import {
  DirectoryPath,
  Operator
} from '@yalam/core';
import {
  EMPTY,
  from,
  pipe,
} from 'rxjs';
import {
  take,
  map,
  mergeAll,
} from 'rxjs/operators';
import {
  sink
} from './sink';

/**
 * @description
 * An operator that trigger a single task on event.
 */
export const task = (task: (entry: DirectoryPath) => Promise<void> | void): Operator => {
  return pipe(
    take(1),
    map(event => {
      const result = task(event.entry);
      if (!isPromise(result)) {
        return EMPTY;
      }
      else {
        return from(result)
      }
    }),
    mergeAll(),
    sink()
  );
}
