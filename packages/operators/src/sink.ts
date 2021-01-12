import { OperatorFunction } from 'rxjs';
import { filter } from 'rxjs/operators';
import {
  InputEvent,
  Asset
} from '@yalam/core';

/**
 * @description
 * An operator that acts as a black hole. Nothing can escape from it.
 */
export const sink = (): OperatorFunction<InputEvent | Asset, Asset> => filter((value) => false)
