import PQueue from 'p-queue';
import { BindingKey } from '@loopback/context';

import {
  IAssetCache,
  IErrorCache,
  IErrorRegistry,
  IFSCache,
  IHashGenerator,
  IHashRegistry,
  IReporterRegistry,
  IRequestCache,
  ITaskRegistry
} from './interfaces';
import {
  DirectoryPath,
  Task
} from './types';

export namespace CoreBindings {
  export const VERSION = BindingKey.create<string>('core.version');
  export const QUEUE = BindingKey.create<PQueue>('core.queue');
  export const DISABLE_CACHE = BindingKey.create<boolean>('core.cache.disable');
  export const CACHE_DIR = BindingKey.create<DirectoryPath>('core.cache.directory');
  export const CACHE_KEY = BindingKey.create<string>('core.cache.key');
  export const HASH_GENERATOR = BindingKey.create<IHashGenerator>('core.hash_generator');
}

export namespace RegistryBindings {
  export const REPORTER_REGISTRY = BindingKey.create<IReporterRegistry>('registry.reporter');
  export const TASK_REGISTRY = BindingKey.create<ITaskRegistry>('registry.task');
  export const HASH_REGISTRY = BindingKey.create<IHashRegistry>('registry.hash');
  export const ERROR_REGISTRY = BindingKey.create<IErrorRegistry>('registry.error');
}

export namespace RequestBindings {
  export const TASK_NAME = BindingKey.create<string>('request.task.name');
  export const TASK_FN = BindingKey.create<Task>('request.task.fn');
  export const ENTRY = BindingKey.create<DirectoryPath>('request.entry');
  export const CACHE_KEY = BindingKey.create<string>('request.cache.key');
}

export namespace CacheBindings {
  export const REQUEST_CACHE_DIR = BindingKey.create<DirectoryPath>('cache.request.directory');
  export const REQUEST_CACHE = BindingKey.create<IRequestCache>('cache.request');
  export const FS_CACHE = BindingKey.create<IFSCache>('cache.fs');
  export const ASSET_CACHE = BindingKey.create<IAssetCache>('cache.assets');
  export const ERROR_CACHE = BindingKey.create<IErrorCache>('cache.errors');
}
