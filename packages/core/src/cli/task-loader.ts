import path from 'path';
import fs from 'fs';
import { Yalam } from '../core';
import { Task } from '../types';

interface TaskLoaderOptions {
  yalam: Yalam;
  configPath?: string;
}

export class TaskLoader {

  private configPath: string;
  private yalam: Yalam;

  constructor(options: TaskLoaderOptions) {
    this.yalam = options.yalam;
    this.configPath = options.configPath || path.join(process.cwd(), 'Yalamfile.js');
  }

  public load() {
    const configPath = path.resolve(this.configPath);

    if (!fs.existsSync(configPath))
      throw new Error(`File not found: "${this.configPath}"`);

    const tasks = Object.entries(require(configPath))

    tasks.map(([key, task]) => {
      if (typeof task !== 'function')
        throw new Error(`Task is not a function: "${key}"`);

      this.yalam.add(key, task as Task);
    })
  }
}
