import { OperatorFunction } from 'rxjs';
import { filter } from 'rxjs/operators';
import {
  InputEvent,
  Asset
} from '@yalam/core';

export const sink = (): OperatorFunction<InputEvent | Asset, Asset> => filter((value) => false)
