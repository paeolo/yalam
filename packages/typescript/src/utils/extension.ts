import path from 'path';
import replace from 'replace-ext';
import {
  FileEvent,
  FilePath,
  ImmutableAsset
} from '@yalam/core';

export const isTypescript = (asset: ImmutableAsset | FileEvent) => ['.ts']
  .includes(path.extname(asset.path));

export const replaceExt = (extension: string) =>
  (value: FilePath) => replace(value, extension)
