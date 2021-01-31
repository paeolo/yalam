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

  let result;

  try {
    result = require(configPath);
  } catch (error) {
    throw new Error(error.stack);
  }

  Object.entries(result).forEach(([task, fn]) => {
    if (typeof fn !== 'function') {
      throw new Error(
        `${task} is not a function.`
      );
    }
  });

  return result;
}
