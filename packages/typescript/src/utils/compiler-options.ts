import ts from 'typescript';

import {
  FilePath
} from '@yalam/core';

export const getTSConfigOrFail = (entry: FilePath) => {
  const configPath = ts.findConfigFile(entry, ts.sys.fileExists, 'tsconfig.json');

  if (!configPath) {
    throw new Error(
      `Could not find a valid "tsconfig.json" at ${entry}.`
    );
  }

  return ts.readJsonConfigFile(configPath, ts.sys.readFile)
}
