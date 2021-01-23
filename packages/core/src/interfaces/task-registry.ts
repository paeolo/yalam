import {
  DirectoryPath,
  Task
} from '../types';

export interface TaskDictionary {
  [key: string]: Task;
};

export interface RegistryResult {
  cacheKey: string;
  fn: Task;
}

export interface GetTaskOptions {
  task: string;
  entry: DirectoryPath;
}

export interface ITaskRegistry {
  getResult(options: GetTaskOptions): Promise<RegistryResult>;
}
