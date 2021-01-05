import path from 'path';
import chalk from 'chalk';
import replaceHomedir from 'replace-homedir';
import fs from 'fs/promises';
import archy from 'archy';
import { constants } from 'fs';

import { PRETTY_HOME } from './constants';

export const printTasks = async (configPath: string) => {
  const prettyConfigPath = replaceHomedir(
    path.resolve(configPath),
    PRETTY_HOME
  );

  try {
    await fs.access(configPath, constants.F_OK);
  } catch {
    throw new Error(`File not found: ${prettyConfigPath}`);
  }

  const tasks = Object.keys(require(configPath));

  console.log(
    archy({
      label: `Tasks for ${chalk.magenta(prettyConfigPath)}`,
      nodes: tasks
    })
  );
}
