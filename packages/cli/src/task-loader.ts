import path from 'path';
import replaceHomedir from 'replace-homedir';
import fs from 'fs/promises';
import { constants } from 'fs';
import {
  Yalam,
  Task
} from '@yalam/core';

import { PRETTY_HOME } from './constants';

interface TaskLoaderOptions {
  yalam: Yalam;
  configPath: string;
}

export class TaskLoader {
  private configPath: string;
  private yalam: Yalam;

  constructor(options: TaskLoaderOptions) {
    this.yalam = options.yalam;
    this.configPath = options.configPath;
  }

  public async load() {
    const configPath = path.resolve(this.configPath);
    const prettyConfigPath = replaceHomedir(
      this.configPath,
      PRETTY_HOME
    );

    try {
      await fs.access(configPath, constants.F_OK);
    } catch {
      throw new Error(`File not found: ${prettyConfigPath}`);
    }

    const tasks = Object.entries(require(configPath));

    tasks.map(([key, task]) => {
      if (typeof task !== 'function') {
        throw new Error(`Task is not a function: ${key}`);
      }
      this.yalam.addTask(key, task as Task);
    })
  }
}
