import { OperatorFunction } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Asset,
} from '../types';

interface Transformer {
  transform(asset: Asset): Asset;
}

export const transform = (transformer: Transformer): OperatorFunction<Asset, Asset> => (source) => {
  return source.pipe(
    map(value => value)
  );
}
