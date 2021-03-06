import PQueue from 'p-queue';
import watcher from '@parcel/watcher';
import setImmediatePromise from 'set-immediate-promise';
import { inject } from '@loopback/context';
import {
  from,
  connectable,
  Subject
} from 'rxjs';
import {
  map,
  mergeAll,
  tap
} from 'rxjs/operators';

import {
  Asset,
  AssetStatus,
  AsyncSubscription,
  DirectoryPath,
  InputEvent,
  Operator
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
    @inject(RequestBindings.PIPELINE_NAME) private pipeline: string,
    @inject(RequestBindings.PIPELINE_FN) private fn: Operator[],
    @inject(RequestBindings.ENTRY) private entry: DirectoryPath,
    @inject(CacheBindings.REQUEST_CACHE) private requestCache: IRequestCache,
    @inject(RegistryBindings.ERROR_REGISTRY) private errors: IErrorRegistry,
    @inject(RegistryBindings.REPORTER_REGISTRY) private reporters: IReporterRegistry,
  ) {
    this.ignoreSet = new Set();
  }

  private onInput(events: InputEvent[]) {
    this.requestCache.onInput(events);

    this
      .reporters
      .onInput(this.pipeline, events);
    this
      .errors
      .onInput(this.pipeline, events);
  }

  private onBuilt(asset: Asset) {
    switch (asset.status) {
      case AssetStatus.ERROR:
        this.errors.onError(this.pipeline, asset);
        this.requestCache.onError(asset);
        break;
      case AssetStatus.ARTIFACT:
        this.reporters.onBuilt(this.pipeline, asset);
        this.requestCache.onBuilt(asset);
        this.ignoreSet.add(asset.distPath);
        this.ignoreSet.add(asset.distPath.concat('.map'));
        break;
      case AssetStatus.DELETED:
        this.requestCache.onDeleted(asset);
        this.reporters.onDeleted(this.pipeline, asset);
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

    await this.queue.add(
      () => this.buildEvents(input, false)
    );
  }

  private async buildEvents(events: InputEvent[], throwOnFail: boolean) {
    this.onInput(events);

    const commitOrFail = (asset: Asset) => {
      if (throwOnFail && asset.status === AssetStatus.ERROR) {
        throw asset.error;
      }
      else {
        return from(asset.commit());
      }
    }

    for (const operator of this.fn) {
      const input = connectable(from(events), new Subject());

      await new Promise<void>((resolve, reject) => {
        operator(input)
          .pipe(
            tap(asset => this.onBuilt(asset)),
            map(asset => commitOrFail(asset)),
            mergeAll()
          )
          .subscribe({
            error: reject,
            complete: resolve
          });

        input.connect();
      });
    }

    await setImmediatePromise();
    this.requestCache.batchUpdate();
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
    await this.queue.add(
      async () => {
        const events = await this.requestCache.getInputEvents();
        await this.buildEvents(events, true)
      }
    );
  }

  public async watch(): Promise<AsyncSubscription> {
    await this.queue.add(
      async () => {
        const events = await this.requestCache.getInputEvents();
        await this.buildEvents(events, false)
      }
    );

    const subscription = await this.getSubscription();

    return {
      unsubscribe: async () => {
        await subscription.unsubscribe();
        await this.queue.onIdle();
      }
    }
  }
}
