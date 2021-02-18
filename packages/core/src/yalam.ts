import PQueue from 'p-queue';
import path from 'path';
import {
  BindingScope,
  Context,
} from '@loopback/context';

import {
  CoreBindings,
  RegistryBindings,
} from './keys';
import {
  TaskDictionary,
} from './interfaces';
import {
  DirectoryPath,
  Reporter
} from './types';
import {
  getDependencies,
  getVersion
} from './utils'
import * as Services from './services';
import {
  CACHE_KEY,
  CACHE_DIR,
} from './constants';

export interface YalamOptions {
  disableCache?: boolean;
  cacheDir?: string;
  cacheKey?: string;
  reporters?: Reporter[];
}

export interface BuildOptions {
  entry: DirectoryPath;
  task: string;
}

export class Yalam {
  private context: Context;

  constructor(
    entries: DirectoryPath[],
    config: TaskDictionary,
    options: YalamOptions
  ) {
    this.context = new Context();

    this.context.bind(CoreBindings.DEPENDENCIES)
      .toDynamicValue(() => getDependencies(entries))
      .inScope(BindingScope.SINGLETON)
      .lock();

    this.context.bind(CoreBindings.VERSION)
      .to(getVersion())
      .lock();

    this.context.bind(CoreBindings.QUEUE)
      .to(new PQueue())
      .lock();

    this.context.bind(CoreBindings.CACHE_KEY)
      .to(options.cacheKey || CACHE_KEY)
      .lock();

    this.context.bind(CoreBindings.CACHE_DIR)
      .to(path.resolve(options.cacheDir || CACHE_DIR))
      .lock();

    this.context.bind(CoreBindings.DISABLE_CACHE)
      .to(options.disableCache || false)
      .lock();

    this.context.bind(CoreBindings.HASH_GENERATOR)
      .toClass(Services.HashGenerator)
      .inScope(BindingScope.SINGLETON)
      .lock();

    this.context.bind(CoreBindings.DEPENDENCY_RUNNER)
      .toClass(Services.DependencyRunner)
      .inScope(BindingScope.SINGLETON)
      .lock();

    this.context.bind(RegistryBindings.HASH_REGISTRY)
      .toClass(Services.HashRegistry)
      .inScope(BindingScope.SINGLETON)
      .lock();

    this.context.configure(RegistryBindings.TASK_REGISTRY)
      .to(config)
      .lock();

    this.context.bind(RegistryBindings.TASK_REGISTRY)
      .toClass(Services.TaskRegistry)
      .inScope(BindingScope.SINGLETON)
      .lock();

    this.context.configure(RegistryBindings.REPORTER_REGISTRY)
      .to(options.reporters || [])
      .lock();

    this.context.bind(RegistryBindings.REPORTER_REGISTRY)
      .toClass(Services.ReporterRegistry)
      .inScope(BindingScope.SINGLETON)
      .lock();

    this.context.bind(RegistryBindings.ERROR_REGISTRY)
      .toClass(Services.ErrorRegistry)
      .inScope(BindingScope.SINGLETON)
      .lock();
  }

  public async build() {
    return (await this.context.get(CoreBindings.DEPENDENCY_RUNNER)).build();
  }

  public async watch() {
    return (await this.context.get(CoreBindings.DEPENDENCY_RUNNER)).watch();
  }
}
