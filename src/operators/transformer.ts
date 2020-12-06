import {
  Asset,
  OperatorFunction
} from '../types';

interface Transformer {

}

export const transform = (transformer: Transformer): OperatorFunction<Asset, Asset> => (source) => {
  return source;
}
