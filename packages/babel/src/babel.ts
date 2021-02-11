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
    [
      '@babel/preset-env',
      {
        configPath: asset.entry
      }
    ]
  ];

  if (path.extname(asset.path) === '.ts') {
    presets.push(['@babel/preset-typescript']);
  }

  return {
    filename: asset.sourcePath,
    cwd: asset.entry,
    inputSourceMap: asset.sourceMap,
    sourceMaps: true,
    presets,
    ...options
  };
}

const transpile = async (asset: FileAsset, options: BabelOptions): Promise<OneToOneResult> => {
  let contents;
  let sourceMap;
  const code = asset.contents.toString();
  const babelResult = await Babel.transformAsync(
    code,
    getOptions(asset, options)
  );

  if (!babelResult) {
    throw new Error(`BabelResult is undefined for asset ${asset.distPath}`);
  }

  if (babelResult.code) {
    contents = Buffer.from(babelResult.code);
  }

  if (babelResult.map) {
    sourceMap = {
      map: babelResult.map,
      referencer: (path: string) => `//# sourceMappingURL=${path}`
    };
  }

  return {
    contents,
    sourceMap
  };
}

const isJavascript = (asset: ImmutableAsset) => ['.js', '.ts']
  .includes(path.extname(asset.path));

export const babel = (options: BabelOptions = {}) => oneToOne({
  filter: (asset) => isJavascript(asset),
  getPath: (path) => replaceExt(path, '.js'),
  getResult: (asset) => transpile(asset, options),
});
