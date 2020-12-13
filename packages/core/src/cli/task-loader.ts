import path from 'path';
import chalk from 'chalk';
import replaceHomedir from 'replace-homedir';
import fs from 'fs/promises';
import archy from 'archy';
import { constants } from 'fs';

import {
  Yalam,
  Task
} from '../core';
import {
  FILE_NOT_FOUND,
  TASK_NOT_FUNCTION
} from '../errors';
import {
  YALAM_FILE
} from '../constants';

interface TaskLoaderOptions {
  yalam: Yalam;
  configPath?: string;
}

export class TaskLoader {

  private configPath: string;
  private yalam: Yalam;

  constructor(options: TaskLoaderOptions) {
    this.yalam = options.yalam;
    this.configPath = options.configPath || path.join(process.cwd(), YALAM_FILE);
  }

  public async load() {
    const configPath = path.resolve(this.configPath);
    const prettyConfigPath = replaceHomedir(this.configPath, '~');

    try {
      await fs.access(configPath, constants.F_OK);
    } catch {
      throw FILE_NOT_FOUND(prettyConfigPath);
    }

    const tasks = Object.entries(require(configPath));

    tasks.map(([key, task]) => {
      if (typeof task !== 'function')
        throw TASK_NOT_FUNCTION(key);

      this.yalam.add(key, task as Task);
    })
  }

  public async show() {
    const configPath = path.resolve(this.configPath);
    const prettyConfigPath = replaceHomedir(this.configPath, '~');

    try {
      await fs.access(configPath, constants.F_OK);
    } catch {
      throw FILE_NOT_FOUND(prettyConfigPath);
    }

    const tasks = Object.keys(require(configPath));

    console.log(archy({
      label: `Tasks for ${chalk.magenta(prettyConfigPath)}`,
      nodes: tasks
    }));
  }
}
