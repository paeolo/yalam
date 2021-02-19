import {
  concat,
  OperatorFunction,
} from 'rxjs';
import {
  shareReplay
} from 'rxjs/operators';

/**
 * @description
 * A meta-operator that replays the stream for each provided pipeline sequentially.
 */
export const series = <S, T>(...pipelines: OperatorFunction<S, T>[]): OperatorFunction<S, T> => (input) => {
  const replay = shareReplay<S>()(input);

  return concat(
    ...pipelines.map(pipeline => pipeline(replay))
  );
}
