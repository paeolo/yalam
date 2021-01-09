import {
  concat,
  OperatorFunction,
} from 'rxjs';
import {
  shareReplay
} from 'rxjs/operators';

export const series = <S, T>(...tasks: OperatorFunction<S, T>[]): OperatorFunction<S, T> => (input) => {
  const replay = shareReplay<S>()(input);

  return concat(
    ...tasks.map(task => task(replay))
  );
}
