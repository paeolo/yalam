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
} from '../../types';
import {
  IErrorRegistry,
  IReporterRegistry,
  IRequestRunner
} from "../../interfaces";
import {
  CoreBindings,
  RegistryBindings,
  RequestBindings
} from '../../keys';
import {
  FileEvent,
  InitialEvent
} from '../../events';

export class RequestRunner implements IRequestRunner {
  private ignoreSet: Set<FilePath>;

  constructor(
    @inject(CoreBindings.QUEUE) private queue: PQueue,
    @inject(RegistryBindings.REPORTER_REGISTRY) private reporters: IReporterRegistry,
    @inject(RegistryBindings.ERROR_REGISTRY) private errors: IErrorRegistry,
    @inject(RequestBindings.TASK_NAME) private task: string,
    @inject(RequestBindings.TASK_FN) private fn: Task,
    @inject(RequestBindings.ENTRY) private entry: DirectoryPath,
    @inject(CoreBindings.CACHE_DIR) private cacheDir: DirectoryPath,
    @inject(RequestBindings.CACHE_KEY) private cacheKey: string,
  ) {
    this.ignoreSet = new Set();
  }

  private onBuilt(asset: Asset) {
    switch (asset.status) {
      case AssetStatus.ERROR:
        this.errors.onError(this.task, asset);
        break;
      case AssetStatus.ARTIFACT:
        this.reporters.onBuilt(this.task, asset);
        this.ignoreSet.add(asset.distPath);
        this.ignoreSet.add(asset.distPath.concat('.map'));
        break;
      case AssetStatus.DELETED:
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
      .filter((event) => !this.ignoreSet.has(event.path));

    if (input.length === 0) {
      return;
    }

    this.queueEvents(this.getFileEvents(events), false);
  }

  private getFileEvents(events: watcher.Event[]): FileEvent[] {
    return events.map((event) => new FileEvent({
      type: event.type === 'delete'
        ? EventType.DELETED
        : EventType.UPDATED,
      entry: this.entry,
      path: event.path,
      cache: {
        directory: this.cacheDir,
        key: this.cacheKey,
      },
    }));
  }

  private queueEvents(events: InputEvent[], throwOnFail: boolean) {
    this.errors
      .onInput(this.task, events);
    this.reporters
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

  private getSubscription() {
    return watcher
      .subscribe(
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
    const initialEvent = new InitialEvent({
      entry: this.entry,
      cache: {
        directory: this.cacheDir,
        key: this.cacheKey
      }
    });

    await this.queueEvents([initialEvent], true);
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
