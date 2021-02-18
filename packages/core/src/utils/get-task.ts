import {
  DependencyNode
} from '../interfaces';

export const getTaskOrFail = (dependency: DependencyNode, path: string) => {
  if (typeof dependency.config[path] !== 'string') {
    throw new Error(
      `Your "package.json" at ${dependency.entry} should provide a task name at path config.yalam.${path}`
    );
  }
  return dependency.config[path];
}
