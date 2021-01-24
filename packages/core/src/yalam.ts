import PQueue from 'p-queue';
import path from 'path';
import {
  BindingScope,
  Context,
  instantiateClass,
} from '@loopback/context';

import {
  CoreBindings,
  RequestBindings
} from './keys';
import {
  TaskDictionary,
  Reporter
} from './interfaces';
import {
  DirectoryPath,
} from './types';
import {
  getVersion
} from './utils'
import {
  RequestRunner,
  HashGenerator,
  HashRegistry,
  TaskRegistry,
  ReporterRegistry
} from './services';
import {
  CACHE_KEY,
  CACHE_DIR
} from './constants';

export interface YalamOptions {
  config: TaskDictionary;
  disableCache?: boolean;
  cacheDir?: string;
  cacheKey?: string;
  reporters?: Reporter[];
}

export interface BuildOptions {
  task: string;
  entry: DirectoryPath;
}

export class Yalam {
  private context: Context;

  constructor(options: YalamOptions) {
    this.context = new Context();

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
      .toClass(HashGenerator)
      .inScope(BindingScope.SINGLETON)
      .lock();

    this.context.bind(CoreBindings.HASH_REGISTRY)
      .toClass(HashRegistry)
      .inScope(BindingScope.SINGLETON)
      .lock();

    this.context.configure(CoreBindings.TASK_REGISTRY)
      .to(options.config)
      .lock();

    this.context.bind(CoreBindings.TASK_REGISTRY)
      .toClass(TaskRegistry)
      .inScope(BindingScope.SINGLETON)
      .lock();

    this.context.configure(CoreBindings.REPORTER_REGISTRY)
      .to(options.reporters || [])
      .lock();

    this.context.bind(CoreBindings.REPORTER_REGISTRY)
      .toClass(ReporterRegistry)
      .inScope(BindingScope.SINGLETON)
      .lock();
  }

  private async getRequestRunner(options: BuildOptions) {
    const context = new Context(this.context);
    const entry = path.resolve(options.entry);

    const registry = await this
      .context
      .get(CoreBindings.TASK_REGISTRY);

    const registryResult = await registry.getResult({
      task: options.task,
      entry,
    });

    context.bind(RequestBindings.TASK_NAME)
      .to(options.task)
      .lock();

    context.bind(RequestBindings.TASK_FN)
      .to(registryResult.fn)
      .lock();

    context.bind(RequestBindings.ENTRY)
      .to(entry)
      .lock();

    context.bind(RequestBindings.CACHE_KEY)
      .to(registryResult.cacheKey)
      .lock();

    return instantiateClass(RequestRunner, context);
  }

  public async build(options: BuildOptions) {
    return (await this.getRequestRunner(options)).build();
  }

  public async watch(options: BuildOptions) {
    return (await this.getRequestRunner(options)).watch();
  }
}
