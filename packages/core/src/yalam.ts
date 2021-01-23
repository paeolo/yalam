import path from 'path';
import EventEmitter from 'eventemitter3';
import {
  BindingScope,
  Context,
  instantiateClass
} from '@loopback/context';

import {
  CoreBindings,
  RequestBindings
} from './keys';
import {
  TaskDictionary
} from './interfaces';
import {
  DeletedAsset,
  ErrorAsset,
  FileAsset
} from './assets';
import {
  DirectoryPath,
  InputEvent,
  Reporter
} from './types';
import {
  getVersion
} from './utils'
import {
  RequestRunner,
  HashGenerator,
  HashRegistry,
  TaskRegistry
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

interface EventTypes {
  input: (events: InputEvent[]) => void;
  built: (asset: FileAsset) => void;
  deleted: (asset: DeletedAsset) => void;
  idle: (errors: ErrorAsset[]) => void;
}

export class Yalam extends EventEmitter<EventTypes> {
  private context: Context;

  constructor(options: YalamOptions) {
    super();
    this.context = new Context();

    this.context.bind(CoreBindings.CACHE_KEY)
      .to(options.cacheKey || CACHE_KEY)
      .lock();

    this.context.bind(CoreBindings.CACHE_DIR)
      .to(path.resolve(options.cacheDir || CACHE_DIR))
      .lock();

    this.context.bind(CoreBindings.DISABLE_CACHE)
      .to(options.disableCache || false)
      .lock();

    this.context.bind(CoreBindings.VERSION)
      .to(getVersion())
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

    if (options.reporters) {
      options.reporters.forEach(
        (reporter) => this.register(reporter)
      );
    }
  }

  private register(reporter: Reporter) {
    if (reporter.onInput) {
      this.addListener(
        'input',
        reporter.onInput.bind(reporter)
      );
    }
    if (reporter.onBuilt) {
      this.addListener(
        'built',
        reporter.onBuilt.bind(reporter)
      );
    }
    if (reporter.onDeleted) {
      this.addListener(
        'deleted',
        reporter.onDeleted.bind(reporter)
      );
    }
    if (reporter.onIdle) {
      this.addListener(
        'idle',
        reporter.onIdle.bind(reporter)
      );
    }
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
