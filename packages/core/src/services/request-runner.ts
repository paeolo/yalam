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
  EventType,
  InputEvent,
  Task
} from '../types';
import {
  IReporterRegistry,
  IRequestRunner
} from "../interfaces";
import {
  CoreBindings,
  RequestBindings
} from '../keys';
import { FileEvent, InitialEvent } from '../events';

export class RequestRunner implements IRequestRunner {
  constructor(
    @inject(CoreBindings.QUEUE) private queue: PQueue,
    @inject(CoreBindings.CACHE_DIR) private cacheDir: DirectoryPath,
    @inject(CoreBindings.REPORTER_REGISTRY) private reporterRegistry: IReporterRegistry,
    @inject(RequestBindings.TASK_NAME) private task: string,
    @inject(RequestBindings.TASK_FN) private fn: Task,
    @inject(RequestBindings.ENTRY) private entry: DirectoryPath,
    @inject(RequestBindings.CACHE_KEY) private cacheKey: string,
  ) { }

  private onBuilt(asset: Asset) {
    switch (asset.status) {
      case AssetStatus.ARTIFACT:
        this
          .reporterRegistry
          .onBuilt(this.task, asset);
        break;
      case AssetStatus.DELETED:
        this
          .reporterRegistry
          .onDeleted(this.task, asset);
        break;
    }
  }

  private getSubscription() {
    const onEvents = async (err: Error | null, events: watcher.Event[]) => {
      if (err) {
        throw err;
      }

      this.queueEvents(
        this.getFileEvents(events),
        false
      );
    };

    return watcher.subscribe(
      this.entry,
      onEvents,
      { ignore: [this.cacheDir] }
    );
  }

  private getFileEvents(events: watcher.Event[]): FileEvent[] {
    return events
      .map((event) => new FileEvent({
        type: event.type === 'delete'
          ? EventType.DELETED
          : EventType.UPDATED,
        cache: {
          directory: this.cacheDir,
          key: this.cacheKey,
        },
        entry: this.entry,
        path: event.path,
      }));
  }

  private queueEvents(events: InputEvent[], throwOnFail: boolean) {
    this
      .reporterRegistry
      .onInput(this.task, events);

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
    });
  }

  public async build() {
  }

  public async watch(): Promise<AsyncSubscription> {
    const initialEvent = new InitialEvent({
      entry: this.entry,
      cache: {
        directory: this.cacheDir,
        key: this.cacheKey
      }
    });

    await this.queueEvents([initialEvent], false);
    await this.queue.onIdle();

    const subscription = await this.getSubscription();

    return {
      unsubscribe: async () => {
        await subscription.unsubscribe();
        await this.queue.onIdle();
      }
    }
  }
}
