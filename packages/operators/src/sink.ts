import { OperatorFunction } from 'rxjs';
import { filter } from 'rxjs/operators';
import {
  Asset,
  InputEvent
} from '@yalam/core';

export const sink = (): OperatorFunction<Asset | InputEvent, Asset> => filter((value) => false)
