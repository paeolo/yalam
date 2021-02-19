import PQueue from 'p-queue';
import { BindingKey } from '@loopback/context';

import {
  DependencyNode,
  IAssetCache,
  IErrorCache,
  IErrorRegistry,
  IFSCache,
  IHashGenerator,
  IHashRegistry,
  IReporterRegistry,
  IRequestCache,
  IRequestRunner,
  IPipelineRegistry
} from './interfaces';
import {
  DirectoryPath,
  Pipeline
} from './types';

export namespace CoreBindings {
  export const DEPENDENCIES = BindingKey.create<DependencyNode[]>('core.dependencies');
  export const VERSION = BindingKey.create<string>('core.version');
  export const QUEUE = BindingKey.create<PQueue>('core.queue');
  export const DISABLE_CACHE = BindingKey.create<boolean>('core.cache.disable');
  export const CACHE_DIR = BindingKey.create<DirectoryPath>('core.cache.directory');
  export const CACHE_KEY = BindingKey.create<string>('core.cache.key');
  export const HASH_GENERATOR = BindingKey.create<IHashGenerator>('core.hash_generator');
  export const DEPENDENCY_RUNNER = BindingKey.create<IRequestRunner>('core.dependency_runner');
}

export namespace RegistryBindings {
  export const REPORTER_REGISTRY = BindingKey.create<IReporterRegistry>('registry.reporter');
  export const PIPELINE_REGISTRY = BindingKey.create<IPipelineRegistry>('registry.pipeline');
  export const HASH_REGISTRY = BindingKey.create<IHashRegistry>('registry.hash');
  export const ERROR_REGISTRY = BindingKey.create<IErrorRegistry>('registry.error');
}

export namespace RequestBindings {
  export const PIPELINE_NAME = BindingKey.create<string>('request.pipeline.name');
  export const PIPELINE_FN = BindingKey.create<Pipeline>('request.pipeline.fn');
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
