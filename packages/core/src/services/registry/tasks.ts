import {
  config,
  inject
} from "@loopback/context";

import {
  RegistryBindings
} from "../../keys";
import {
  IHashRegistry,
  ITaskRegistry,
  TaskDictionary,
  GetTaskOptions,
  RegistryResult
} from "../../interfaces";

export class TaskRegistry implements ITaskRegistry {
  constructor(
    @config() private dictionary: TaskDictionary,
    @inject(RegistryBindings.HASH_REGISTRY) private hashRegistry: IHashRegistry,
  ) { }

  public async getResult(options: GetTaskOptions): Promise<RegistryResult> {
    if (!this.dictionary[options.task]) {
      throw new Error(
        `Task "${options.task}" is not defined`
      );
    }

    return {
      fn: this.dictionary[options.task],
      cacheKey: await this.hashRegistry
        .getResult({
          task: options.task,
          entry: options.entry,
          useCacheKey: true
        }),
    }
  }
}
