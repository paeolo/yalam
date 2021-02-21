import path from 'path';
import {
  DirectoryPath
} from '../types';
import {
  DependencyNode
} from '../interfaces';
import {
  isSkipped,
  getPKG,
} from './get-pkg';

export const getDependencies = async (entries: DirectoryPath[], disableSkip: boolean) => {
  const result: DependencyNode[] = [];

  const packages = await Promise.all(entries.map(async (entry) => ({
    entry,
    pkg: await getPKG(entry)
  })));

  const packageNames: string[] = packages.map(value => value.pkg.name);

  for (const value of packages) {
    const dependencies: string[] = [];
    const {
      entry,
      pkg
    } = value;

    if (!disableSkip && isSkipped(pkg)) {
      continue;
    }

    const addDependencies = (value: object) => {
      if (value && typeof value === 'object') {
        for (const dependency in value) {
          if (packageNames.includes(dependency)) {
            dependencies.push(dependency);
          }
        }
      }
    }

    addDependencies(pkg.dependencies);
    addDependencies(pkg.devDependencies);

    result.push({
      name: pkg.name,
      entry: path.resolve(entry),
      config: pkg.config.yalam,
      dependencies,
    })
  }

  return result;
}
