import {
  pipe,
  OperatorFunction,
  from,
} from 'rxjs';
import {
  map,
  filter,
  mergeAll
} from 'rxjs/operators';
import {
  ErrorAsset,
  FileEvent,
} from '@yalam/core';

interface CheckEventOptions {
  checkEvent: (event: FileEvent) => Promise<void>;
  filter?: (event: FileEvent) => boolean;
}

const alwaysTrue = (event: FileEvent) => true;
const filterNullish = <T>() => filter(x => x != null) as OperatorFunction<T | null | undefined, T>;


const respondToEvent = async (event: FileEvent, options: CheckEventOptions) => {
  try {
    await options.checkEvent(event);
    return;
  } catch (error) {
    return new ErrorAsset({
      event,
      error
    });
  }
}

/**
 * @description
 * An operator that apply a check function on file event and return error asset on failure.
 */
export const checkEvent = (options: CheckEventOptions): OperatorFunction<FileEvent, ErrorAsset> => pipe(
  filter(options.filter || alwaysTrue),
  map((event) => from(respondToEvent(event, options))),
  mergeAll(),
  filterNullish()
);
