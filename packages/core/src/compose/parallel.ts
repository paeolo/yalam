import {
  merge,
  OperatorFunction,
} from 'rxjs';
import { publish } from 'rxjs/operators';

export const parallel = <S, T>(...tasks: OperatorFunction<S, T>[]): OperatorFunction<S, T> => (input) => {
  const connectable = publish<S>()(input);

  const result = merge(
    ...tasks.map(task => task(connectable))
  );

  connectable.connect();
  return result;
}
