import path from 'path';
import replace from 'replace-ext';
import { BaseAsset, } from '@yalam/core';

export const enum FileExtension {
  JS = '.js',
  DTS = '.d.ts'
}

export const isTypescript = (asset: BaseAsset) => ['.ts']
  .includes(path.extname(asset.path));

export const replaceExt = (extension: FileExtension) =>
  (asset: BaseAsset) => replace(asset.path, extension)
