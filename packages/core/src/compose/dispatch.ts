import {
  OperatorFunction,
  pipe
} from 'rxjs';
import { distinct } from 'rxjs/operators';

import { Asset } from '../types';
import { parallel } from '../compose';

type AssetTask = OperatorFunction<Asset, Asset>;

export const dispatch = (...tasks: AssetTask[]): AssetTask => pipe(
  parallel(...tasks),
  distinct(asset => asset.fullPath)
)
