import { OperatorFunction } from 'rxjs';
import { filter } from 'rxjs/operators';
import {
  Event,
  Asset
} from '@yalam/core';

export const sink = (): OperatorFunction<Event | Asset, Asset> => filter((value) => false)
