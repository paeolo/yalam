import path from 'path';
import {
  merge,
  OperatorFunction,
  partition
} from 'rxjs';

interface WithPath {
  path: string;
}

/**
 * @description
 * A meta-operator that publishes the stream, with provided file extensions, to each provided pipeline.
 */
export const apply = (extensions: string[]) =>
  <S extends WithPath, T>(...pipelines: OperatorFunction<S, T>[]): OperatorFunction<S, S | T> => (input) => {
    const [
      observable,
      rest
    ] = partition(
      input,
      (value) => extensions.includes(path.extname(value.path))
    );

    return merge(
      rest,
      ...pipelines.map(pipeline => pipeline(observable))
    );
  }
