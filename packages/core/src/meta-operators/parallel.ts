import {
  merge,
  OperatorFunction,
} from 'rxjs';

/**
 * @description
 * A meta-operator that publishes the stream to each provided pipeline.
 */
export const parallel = <S, T>(...pipelines: OperatorFunction<S, T>[]): OperatorFunction<S, T> => (input) => {
  return merge(
    ...pipelines.map(pipeline => pipeline(input))
  );
}
