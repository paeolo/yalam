import {
  merge,
  OperatorFunction,
} from 'rxjs';

/**
 * @description
 * A meta-operator that publishes the stream to each provided operator.
 */
export const parallel = <S, T>(...operators: OperatorFunction<S, T>[]): OperatorFunction<S, T> => (input) => {
  return merge(
    ...operators.map(operator => operator(input))
  );
}
