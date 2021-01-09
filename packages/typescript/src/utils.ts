import path from 'path';
import replaceExt from 'replace-ext';
import { BaseAsset, } from '@yalam/core';

export const enum FileExtension {
  JS = '.js',
  DTS = '.d.ts'
}

export const isTypescript = (asset: BaseAsset) => ['.ts']
  .includes(path.extname(asset.path));

export const replaceExtension = (extension: FileExtension) =>
  (asset: BaseAsset) => replaceExt(asset.path, extension)
