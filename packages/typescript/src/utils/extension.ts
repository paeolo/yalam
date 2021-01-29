import path from 'path';
import replace from 'replace-ext';
import {
  FileEvent,
  ImmutableAsset
} from '@yalam/core';

import {
  OutputExtension
} from '../types';

export const isTypescript = (asset: ImmutableAsset | FileEvent) => ['.ts']
  .includes(path.extname(asset.path));

export const replaceExt = (extension: OutputExtension) =>
  (asset: ImmutableAsset) => replace(asset.path, extension)
