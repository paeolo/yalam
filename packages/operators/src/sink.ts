import { OperatorFunction } from 'rxjs';
import { filter } from 'rxjs/operators';
import {
  Asset,
  Event
} from '@yalam/core';

export const sink = (): OperatorFunction<Asset | Event, Asset> => filter((value) => false)
