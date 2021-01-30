import path from 'path';
import {
  DirectoryPath
} from '@yalam/core';

import {
  RunnerMode
} from '../runner';

export const getPKG = (directory: string) => {
  const pkgPATH = path.resolve(directory);

  try {
    return require(
      path.join(pkgPATH, 'package.json')
    );
  } catch {
    throw new Error(`"package.json" not found: ${directory}`)
  }
}

export const getTask = (directory: DirectoryPath, mode: RunnerMode): string => {
  const pkg = getPKG(directory);

  if (!pkg.config
    || !pkg.config.yalam
    || !pkg.config.yalam[mode]
    || typeof pkg.config.yalam[mode] !== 'string') {
    throw new Error(
      `Your "package.json" at ${directory} should provide a task name at path config.yalam.${mode}`
    );
  }

  return pkg.config.yalam[mode];
}
