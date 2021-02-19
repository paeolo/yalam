import path from 'path';
import fs from 'fs';
import fsAsync from 'fs/promises';
import replaceHomedir from 'replace-homedir';

import {
  PRETTY_HOME
} from '../constants';

export const getConfig = async (filePath: string) => {
  const configPath = path.resolve(filePath);

  const prettyConfigPath = replaceHomedir(
    configPath,
    PRETTY_HOME
  );

  try {
    await fsAsync.access(
      configPath,
      fs.constants.F_OK
    );
  } catch {
    throw new Error(
      `${prettyConfigPath} is not found.`
    );
  }

  let result: any;

  try {
    result = require(configPath);
  } catch (error) {
    throw new Error(error.stack);
  }

  Object.entries(result).forEach(([key, fn]) => {
    const pipeline = Array.isArray(fn) ? fn : [fn];
    if (pipeline.some(value => typeof value !== 'function')) {
      throw new Error(
        `${key} is not a function or an array of function.`
      );
    }
    result[key] = pipeline;
  });

  return result;
}
