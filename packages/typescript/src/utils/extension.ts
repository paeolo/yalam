import path from 'path';
import replace from 'replace-ext';
import {
  FileEvent,
  ImmutableAsset
} from '@yalam/core';

export const isTypescript = (asset: ImmutableAsset | FileEvent) => ['.ts']
  .includes(path.extname(asset.path));

export const replaceExt = (extension: string) =>
  (value: ImmutableAsset | FileEvent) => replace(value.path, extension)
