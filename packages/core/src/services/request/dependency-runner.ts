import path from "path";
import {
  BindingScope,
  Context,
  inject,
  instantiateClass
} from "@loopback/context";

import {
  AsyncSubscription,
  DirectoryPath
} from "../../types";
import {
  IRequestRunner
} from "../../interfaces";
import {
  CacheBindings,
  CoreBindings,
  RegistryBindings,
  RequestBindings
} from "../../keys";
import {
  DependencyNode,
} from '../../interfaces';
import * as Services from '../../services';
import {
  CACHE_NAME
} from "../../constants";

export interface BuildOptions {
  entry: DirectoryPath;
  task: string;
}

export class DependencyRunner implements IRequestRunner {
  constructor(
    @inject(CoreBindings.DEPENDENCIES) private dependencies: DependencyNode[],
    @inject.context() private context: Context
  ) { }

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
      .toClass(Services.FSCache)
      .inScope(BindingScope.SINGLETON)
      .lock();

    context.bind(CacheBindings.ASSET_CACHE)
      .toClass(Services.AssetCache)
      .inScope(BindingScope.SINGLETON)
      .lock();

    context.bind(CacheBindings.ERROR_CACHE)
      .toClass(Services.ErrorCache)
      .inScope(BindingScope.SINGLETON)
      .lock();

    context.bind(CacheBindings.REQUEST_CACHE)
      .toClass(Services.RequestCache)
      .inScope(BindingScope.SINGLETON)
      .lock();

    return instantiateClass(
      Services.RequestRunner,
      context
    );
  }

  public async build() {
  }

  public async watch(): Promise<AsyncSubscription> {
    console.log(this.dependencies)
    return {
      unsubscribe: async () => { }
    }
  }
}
