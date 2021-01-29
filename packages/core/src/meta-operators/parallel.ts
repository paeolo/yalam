import {
  merge,
  OperatorFunction,
} from 'rxjs';

/**
 * @description
 * A meta-operator that publishes the stream to each provided task.
 */
export const parallel = <S, T>(...tasks: OperatorFunction<S, T>[]): OperatorFunction<S, T> => (input) => {
  return merge(
    ...tasks.map(task => task(input))
  );
}
