import PQueue from 'p-queue';
import path from 'path';
import {
  BindingScope,
  Context,
  instantiateClass,
} from '@loopback/context';

import {
  CacheBindings,
  CoreBindings,
  RegistryBindings,
  RequestBindings
} from './keys';
import {
  TaskDictionary,
} from './interfaces';
import {
  DirectoryPath,
  Reporter
} from './types';
import {
  getVersion
} from './utils'
import {
  RequestRunner,
  HashGenerator,
  HashRegistry,
  TaskRegistry,
  ReporterRegistry,
  ErrorRegistry,
  RequestCache,
  FSCache,
  AssetCache,
  ErrorCache
} from './services';
import {
  CACHE_KEY,
  CACHE_DIR,
  CACHE_NAME
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

    this.context.bind(RegistryBindings.HASH_REGISTRY)
      .toClass(HashRegistry)
      .inScope(BindingScope.SINGLETON)
      .lock();

    this.context.configure(RegistryBindings.TASK_REGISTRY)
      .to(options.config)
      .lock();

    this.context.bind(RegistryBindings.TASK_REGISTRY)
      .toClass(TaskRegistry)
      .inScope(BindingScope.SINGLETON)
      .lock();

    this.context.configure(RegistryBindings.REPORTER_REGISTRY)
      .to(options.reporters || [])
      .lock();

    this.context.bind(RegistryBindings.REPORTER_REGISTRY)
      .toClass(ReporterRegistry)
      .inScope(BindingScope.SINGLETON)
      .lock();

    this.context.bind(RegistryBindings.ERROR_REGISTRY)
      .toClass(ErrorRegistry)
      .inScope(BindingScope.SINGLETON)
      .lock();
  }

  private async getRequestRunner(options: BuildOptions) {
    const context = new Context(this.context);
    const entry = path.resolve(options.entry);

    const registry = await this
      .context
      .get(RegistryBindings.TASK_REGISTRY);

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

    context.bind(CacheBindings.REQUEST_CACHE_DIR)
      .to(
        path.join(
          await this.context.get(CoreBindings.CACHE_DIR),
          CACHE_NAME,
          registryResult.cacheKey
        ))
      .lock();

    context.bind(CacheBindings.FS_CACHE)
      .toClass(FSCache)
      .inScope(BindingScope.SINGLETON)
      .lock();

    context.bind(CacheBindings.ASSET_CACHE)
      .toClass(AssetCache)
      .inScope(BindingScope.SINGLETON)
      .lock();

    context.bind(CacheBindings.ERROR_CACHE)
      .toClass(ErrorCache)
      .inScope(BindingScope.SINGLETON)
      .lock();

    context.bind(CacheBindings.REQUEST_CACHE)
      .toClass(RequestCache)
      .inScope(BindingScope.SINGLETON)
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
