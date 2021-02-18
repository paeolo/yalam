import path from 'path';
import fsAsync from 'fs/promises';

import {
  DirectoryPath
} from '../types';

export const isSkipped = (pkg: any): boolean => {
  return pkg.config.yalam === 'skip';
}

export const getPKG = async (entry: DirectoryPath) => {
  const pkgPATH = path.join(entry, 'package.json')

  try {
    const result = JSON.parse(
      (await fsAsync.readFile(pkgPATH)).toString()
    );

    if (!result.name || typeof result.name !== 'string') {
      throw new Error(`"package name is mandatory: ${entry}`)
    }

    if (!result.config
      || !result.config.yalam
      || (typeof result.config.yalam !== 'object'
        && !isSkipped(result))
    ) {
      throw new Error(
        `Your "package.json" at ${entry} should provide an object or "skip" at path config.yalam`
      );
    }

    return result;
  } catch {
    throw new Error(`"package.json" not found: ${entry}`)
  }
}

