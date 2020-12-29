import path from 'path';
import replaceExt from 'replace-ext';
import * as Babel from '@babel/core';

import { Asset } from '@yalam/core';
import {
  transform,
  TransformResult
} from '@yalam/operators';

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
    cwd: asset.getEntry(),
    filename: asset.getSourcePath(),
    inputSourceMap: asset.sourceMap,
    sourceMaps: true,
    plugins,
    presets,
    ...options
  };
}

const transpile = async (asset: Asset, options: BabelOptions): Promise<TransformResult> => {
  let sourceMap;
  const code = asset.getContentsOrFail().toString();
  const babelResult = await Babel.transformAsync(
    code,
    getOptions(asset, options)
  );

  if (!babelResult || !babelResult.code) {
    throw new Error();
  }

  if (babelResult.map) {
    sourceMap = {
      map: babelResult.map,
      referencer: (path: string) => `//# sourceMappingURL=${path}`
    };
  }

  return {
    contents: Buffer.from(babelResult.code),
    sourceMap
  };
}

const isJavascript = (asset: Asset) => ['.js', '.ts']
  .includes(path.extname(asset.path));

export const babel = (options: BabelOptions = {}) => transform({
  filter: (asset) => isJavascript(asset),
  getPath: (asset) => replaceExt(asset.path, '.js'),
  getResult: (asset) => transpile(asset, options),
});
