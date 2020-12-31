import path from 'path';
import chalk from 'chalk';
import replaceHomedir from 'replace-homedir';
import fs from 'fs/promises';
import archy from 'archy';
import { constants } from 'fs';
import {
  Yalam,
  Task
} from '@yalam/core';

interface TaskLoaderOptions {
  yalam: Yalam;
  configPath: string;
}

export class TaskLoader {

  static async show(configPath: string) {
    const prettyConfigPath = replaceHomedir(path.resolve(configPath), '~');

    try {
      await fs.access(configPath, constants.F_OK);
    } catch {
      throw new Error(`File not found: ${prettyConfigPath}`);
    }

    const tasks = Object.keys(require(configPath));

    console.log(archy({
      label: `Tasks for ${chalk.magenta(prettyConfigPath)}`,
      nodes: tasks
    }));
  }

  private configPath: string;
  private yalam: Yalam;

  constructor(options: TaskLoaderOptions) {
    this.yalam = options.yalam;
    this.configPath = options.configPath;
  }

  public async load() {
    const configPath = path.resolve(this.configPath);
    const prettyConfigPath = replaceHomedir(this.configPath, '~');

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
