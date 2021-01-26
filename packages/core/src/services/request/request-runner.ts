import PQueue from 'p-queue';
import watcher from '@parcel/watcher';
import { inject } from '@loopback/context';
import { from } from 'rxjs';
import {
  map,
  mergeAll,
  publish,
} from 'rxjs/operators';

import {
  Asset,
  AssetStatus,
  AsyncSubscription,
  DirectoryPath,
  InputEvent,
  Task
} from '../../types';
import {
  IErrorRegistry,
  IReporterRegistry,
  IRequestCache,
  IRequestRunner
} from "../../interfaces";
import {
  CacheBindings,
  CoreBindings,
  RegistryBindings,
  RequestBindings
} from '../../keys';

export class RequestRunner implements IRequestRunner {
  private ignoreSet: Set<FilePath>;

  constructor(
    @inject(CoreBindings.QUEUE) private queue: PQueue,
    @inject(CoreBindings.CACHE_DIR) private cacheDir: DirectoryPath,
    @inject(RequestBindings.TASK_NAME) private task: string,
    @inject(RequestBindings.TASK_FN) private fn: Task,
    @inject(RequestBindings.ENTRY) private entry: DirectoryPath,
    @inject(CacheBindings.REQUEST_CACHE) private requestCache: IRequestCache,
    @inject(RegistryBindings.ERROR_REGISTRY) private errors: IErrorRegistry,
    @inject(RegistryBindings.REPORTER_REGISTRY) private reporters: IReporterRegistry,
  ) {
    this.ignoreSet = new Set();
  }

  private onBuilt(asset: Asset) {
    switch (asset.status) {
      case AssetStatus.ERROR:
        this.errors.onError(this.task, asset);
        this.requestCache.onError(asset);
        break;
      case AssetStatus.ARTIFACT:
        this.reporters.onBuilt(this.task, asset);
        this.requestCache.onBuilt(asset);
        this.ignoreSet.add(asset.distPath);
        this.ignoreSet.add(asset.distPath.concat('.map'));
        break;
      case AssetStatus.DELETED:
        this.requestCache.onDeleted(asset);
        this.reporters.onDeleted(this.task, asset);
        this.ignoreSet.add(asset.distPath);
        this.ignoreSet.add(asset.distPath.concat('.map'));
        break;
    }
  }

  private async onEvents(error: Error | null, events: watcher.Event[]) {
    if (error) {
      throw error;
    }
    const input = events
      .filter((event) => !this.ignoreSet.has(event.path))
      .map(event => this.requestCache.convertEvent(event));

    if (input.length === 0) {
      return;
    }

    await this.queueEvents(input, false);
  }

  private queueEvents(events: InputEvent[], throwOnFail: boolean) {
    this.errors
      .onInput(this.task, events);
    this.reporters
      .onInput(this.task, events);

    this.requestCache.onInput(events);

    return this.queue.add(async () => {
      const input = publish<InputEvent>()(from(events));

      const onAsset = (asset: Asset) => {
        if (throwOnFail
          && asset.status === AssetStatus.ERROR) {
          throw asset.error;
        }
        return from(asset.commit());
      }

      await new Promise<void>((resolve, reject) => {
        this.fn(input)
          .pipe(
            map(onAsset),
            mergeAll()
          )
          .subscribe({
            next: asset => this.onBuilt(asset),
            error: reject,
            complete: resolve
          });
        input.connect();
      });

      this.requestCache.batchUpdate();
    });
  }

  private getSubscription() {
    return watcher.subscribe(
      this.entry,
      this.onEvents.bind(this),
      {
        ignore: [
          this.cacheDir
        ]
      }
    );
  }

  public async build() {
    const events = await this.requestCache.getInputEvents();
    await this.queueEvents(events, true);
  }

  public async watch(): Promise<AsyncSubscription> {
    const events = await this.requestCache.getInputEvents();
    await this.queueEvents(events, false);

    const subscription = await this.getSubscription();

    return {
      unsubscribe: async () => {
        await subscription.unsubscribe();
        await this.queue.onIdle();
      }
    }
  }
}
