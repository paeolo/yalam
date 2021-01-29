import {
  MonoTypeOperatorFunction,
  pipe
} from 'rxjs';
import { distinct } from 'rxjs/operators';

import { Asset } from '../types';
import { parallel } from '.';

/**
 * @description
 * A meta-operator that publishes the stream to each provided asset task
 * and de-duplicates the assets based on their distPath.
 */
export const dispatch = (...tasks: MonoTypeOperatorFunction<Asset>[]): MonoTypeOperatorFunction<Asset> => pipe(
  parallel(...tasks),
  distinct(asset => asset.distPath)
)
