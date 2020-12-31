import path from 'path';
import replaceExt from 'replace-ext';

import {
  BaseAsset,
  FileAsset
} from '@yalam/core';
import {
  transform,
  TransformResult
} from '@yalam/operators';

interface GenerateTypesOptions {

};

const generate = async (asset: FileAsset, options: GenerateTypesOptions): Promise<TransformResult> => {
  return {
    contents: Buffer.alloc(0),
  };
}

const isTypescript = (asset: BaseAsset) => ['.ts']
  .includes(path.extname(asset.path));

export const generateTypes = (options: GenerateTypesOptions = {}) => transform({
  filter: (asset) => isTypescript(asset),
  getPath: (asset) => replaceExt(asset.path, '.d.ts'),
  getResult: (asset) => generate(asset, options),
});
