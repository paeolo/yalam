import PQueue from "p-queue";
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
import {
  runTopologically,
  checkHasTaskOrFail
} from '../../utils';

export interface BuildOptions {
  entry: DirectoryPath;
  task: string;
}

export enum BuildMode {
  BUILD = 'build',
  WATCH = 'watch'
}

export class DependencyRunner implements IRequestRunner {
  constructor(
    @inject(CoreBindings.DEPENDENCIES) private dependencies: DependencyNode[],
    @inject(CoreBindings.QUEUE) private queue: PQueue,
    @inject.context() private context: Context,
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
    const buildDependency = async (dependency: DependencyNode) => {
      checkHasTaskOrFail(dependency, BuildMode.BUILD);

      const requestRunner = await this.getRequestRunner({
        entry: dependency.entry,
        task: dependency.config[BuildMode.BUILD]
      });

      return requestRunner.build();
    }

    await this.queue.add(() => runTopologically(this.dependencies, buildDependency));
  }

  public async watch(): Promise<AsyncSubscription> {
    const getSubscription = async (dependency: DependencyNode) => {
      checkHasTaskOrFail(dependency, BuildMode.WATCH);

      const requestRunner = await this.getRequestRunner({
        entry: dependency.entry,
        task: dependency.config[BuildMode.WATCH]
      });

      return requestRunner.watch();
    }

    const subscriptions = await this.queue.add(
      () => runTopologically(this.dependencies, getSubscription)
    );

    return {
      unsubscribe: async () => {
        await Promise.all(
          subscriptions.map(
            subscription => subscription.unsubscribe()
          )
        )
      }
    }
  }
}
