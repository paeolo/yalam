import {
  config,
  inject
} from "@loopback/context";

import {
  RegistryBindings
} from "../../keys";
import {
  IHashRegistry,
  IPipelineRegistry,
  PipelineDictionary,
  GetPipelineOptions,
  RegistryResult
} from "../../interfaces";

export class PipelineRegistry implements IPipelineRegistry {
  constructor(
    @config() private dictionary: PipelineDictionary,
    @inject(RegistryBindings.HASH_REGISTRY) private hashRegistry: IHashRegistry,
  ) { }

  public async getResult(options: GetPipelineOptions): Promise<RegistryResult> {
    if (!this.dictionary[options.pipeline]) {
      throw new Error(
        `Pipeline "${options.pipeline}" is not defined`
      );
    }

    return {
      fn: this.dictionary[options.pipeline],
      cacheKey: await this.hashRegistry
        .getResult({
          pipeline: options.pipeline,
          entry: options.entry,
          useCacheKey: true
        }),
    }
  }
}
