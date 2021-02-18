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
  getTaskOrFail,
  unsubscribeAll
} from '../../utils';

export enum BuildMode {
  BUILD = 'build',
  WATCH = 'watch'
}

export class DependencyRunner implements IRequestRunner {
  private subscription: AsyncSubscription | undefined;

  constructor(
    @inject(CoreBindings.DEPENDENCIES) private dependencies: DependencyNode[],
    @inject(CoreBindings.QUEUE) private queue: PQueue,
    @inject.context() private context: Context,
  ) { }

  private async getRequestRunner(dependency: DependencyNode, mode: BuildMode) {
    const context = new Context(this.context);
    const task = getTaskOrFail(dependency, mode);

    const registry = await this
      .context
      .get(RegistryBindings.TASK_REGISTRY);

    const registryResult = await registry.getResult({
      task,
      entry: dependency.entry,
    });

    context.bind(RequestBindings.TASK_NAME)
      .to(task)
      .lock();

    context.bind(RequestBindings.TASK_FN)
      .to(registryResult.fn)
      .lock();

    context.bind(RequestBindings.ENTRY)
      .to(dependency.entry)
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
    const runner = async (dependency: DependencyNode) => {
      return (await this.getRequestRunner(dependency, BuildMode.BUILD)).build();
    }
    await this.queue.add(
      () => runTopologically(this.dependencies, runner)
    );
  }

  public async watch(): Promise<AsyncSubscription> {
    if (this.subscription) {
      return this.subscription;
    }

    const getSubscription = async (dependency: DependencyNode) => {
      return (await this.getRequestRunner(dependency, BuildMode.WATCH)).watch();
    }

    const subscriptions = await this.queue.add(
      () => runTopologically(this.dependencies, getSubscription)
    );

    this.subscription = {
      unsubscribe: async () => {
        this.subscription = undefined;
        await unsubscribeAll(subscriptions);
      }
    }

    return this.subscription;
  }
}
