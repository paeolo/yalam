import { OperatorFunction } from 'rxjs';
import { filter } from 'rxjs/operators';
import {
  Asset
} from '@yalam/core';

/**
 * @description
 * An operator that acts as a black hole. Nothing can escape from it.
 */
export const sink = <T>(): OperatorFunction<T, Asset> => filter((value) => false)
