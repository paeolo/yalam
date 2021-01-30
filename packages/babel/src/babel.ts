import path from 'path';
import replaceExt from 'replace-ext';
import * as Babel from '@babel/core';

import {
  ImmutableAsset,
  FileAsset
} from '@yalam/core';
import {
  oneToOne,
  OneToOneResult
} from '@yalam/operators';

type BabelOptions = Pick<Babel.TransformOptions,
  "configFile"
  | "comments"
  | "compact"
  | "minified"
>;

const getOptions = (asset: FileAsset, options: BabelOptions): Babel.TransformOptions => {
  const presets = [
    '@babel/preset-typescript'
  ];

  return {
    cwd: asset.entry,
    filename: asset.sourcePath,
    inputSourceMap: asset.sourceMap,
    sourceMaps: true,
    presets,
    babelrcRoots: asset.entry,
    ...options
  };
}

const transpile = async (asset: FileAsset, options: BabelOptions): Promise<OneToOneResult> => {
  let sourceMap;
  const code = asset.contents.toString();
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

const isJavascript = (asset: ImmutableAsset) => ['.js', '.ts']
  .includes(path.extname(asset.path));

export const babel = (options: BabelOptions = {}) => oneToOne({
  filter: (asset) => isJavascript(asset),
  getPath: (asset) => replaceExt(asset.path, '.js'),
  getResult: (asset) => transpile(asset, options),
});
