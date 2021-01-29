import path from 'path';
import {
  from,
  of,
  pipe,
  OperatorFunction
} from 'rxjs';
import {
  filter,
  map,
  mergeAll,
} from 'rxjs/operators';
import tinyGlob from 'tiny-glob/sync';
import globrex from 'globrex';
import globParent from 'glob-parent';
import {
  InputEvent,
  FileEvent,
  InitialEvent,
  EventType,
} from '@yalam/core';

interface SourceOptions {
  glob: string;
};

const getEvents = (glob: string, sourceBase: string, event: InitialEvent): FileEvent[] => {
  const files = tinyGlob(
    glob,
    {
      cwd: event.entry,
      filesOnly: true,
      absolute: true
    }
  );
  return files.map(path => event.getFileEvent({
    type: EventType.UPDATED,
    path,
    sourceBase
  }));
};

/**
 * @description
 * An operator that produces file events out of an unique initial event using a glob.
 */
export const source = (options: SourceOptions): OperatorFunction<InputEvent, FileEvent> => {
  const { regex } = globrex(options.glob, { globstar: true });
  const sourceBase = globParent(options.glob);

  return pipe(
    filter(event => event.type === EventType.INITIAL
      || regex.test(path.relative(event.entry, event.path))
    ),
    map(event => {
      switch (event.type) {
        case EventType.INITIAL:
          return from(
            getEvents(
              options.glob,
              sourceBase,
              event
            )
          );
        default:
          return of(
            event.getWithSourceBase(sourceBase)
          );
      }
    }),
    mergeAll()
  )
};
