import path from 'path';
import isPromise from 'is-promise';
import {
  DirectoryPath,
  EventType,
  Operator
} from '@yalam/core';
import {
  EMPTY,
  from,
  pipe,
} from 'rxjs';
import globrex from 'globrex';
import {
  take,
  map,
  mergeAll,
  filter,
} from 'rxjs/operators';
import {
  sink
} from './sink';

interface TaskOptions {
  glob: string;
  fn: (entry: DirectoryPath) => Promise<void> | void;
};

/**
 * @description
 * An operator that trigger a single task on event.
 */
export const task = (options: TaskOptions): Operator => {
  const { regex } = globrex(options.glob, { globstar: true });

  return pipe(
    filter(event => event.type === EventType.INITIAL
      || regex.test(path.relative(event.entry, event.path))
    ),
    take(1),
    map(event => {
      const result = options.fn(event.entry);
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
