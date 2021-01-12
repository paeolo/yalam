import path from 'path';
import replace from 'replace-ext';
import { ImmutableAsset, } from '@yalam/core';

export const enum FileExtension {
  JS = '.js',
  DTS = '.d.ts'
}

export const isTypescript = (asset: ImmutableAsset) => ['.ts']
  .includes(path.extname(asset.path));

export const replaceExt = (extension: FileExtension) =>
  (asset: ImmutableAsset) => replace(asset.path, extension)
