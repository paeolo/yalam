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
  return files.map(path => new FileEvent({
    type: EventType.UPDATED,
    cacheDir: event.cacheDir,
    entry: event.entry,
    path,
    sourceBase,
  }));
};

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
          return from(getEvents(options.glob, sourceBase, event));
        default:
          return of(new FileEvent({
            type: event.type,
            cacheDir: event.cacheDir,
            entry: event.entry,
            path: event.path,
            sourceBase
          }));
      }
    }),
    mergeAll()
  )
};
