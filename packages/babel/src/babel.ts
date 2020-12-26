import path from 'path';
import replaceExt from 'replace-ext';
import * as Babel from '@babel/core';

import { Asset } from '@yalam/core';
import { transform } from '@yalam/operators';

type BabelOptions = Pick<Babel.TransformOptions,
  "configFile"
  | "comments"
  | "compact"
  | "minified"
>;

const getOptions = (asset: Asset, options: BabelOptions): Babel.TransformOptions => {
  const plugins = [];
  const presets = [
    [
      '@babel/preset-env'
    ]
  ];

  if (path.extname(asset.path) === '.ts') {
    plugins.push(
      [
        '@babel/plugin-transform-typescript'
      ]);
  }

  return {
    cwd: asset.getEvent().entry,
    plugins,
    presets,
    ...options
  };
}

const transpile = async (asset: Asset, options: BabelOptions) => {
  const code = asset.getContents().toString();
  const babelResult = await Babel.transformAsync(
    code,
    getOptions(asset, options)
  );

  return babelResult && babelResult.code
    ? Buffer.from(babelResult.code)
    : Buffer.alloc(0);
}

const filter = (asset: Asset) => ['.js', '.ts']
  .includes(path.extname(asset.path));

export const babel = (options: BabelOptions) => transform({
  filter,
  getPath: (asset) => replaceExt(asset.path, '.js'),
  getContents: (asset) => transpile(asset, options),
});
