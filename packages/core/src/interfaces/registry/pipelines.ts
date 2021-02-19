import {
  DirectoryPath,
  Pipeline
} from '../../types';

export interface PipelineDictionary {
  [key: string]: Pipeline;
};

export interface RegistryResult {
  cacheKey: string;
  fn: Pipeline;
}

export interface GetPipelineOptions {
  pipeline: string;
  entry: DirectoryPath;
}

export interface IPipelineRegistry {
  getResult(options: GetPipelineOptions): Promise<RegistryResult>;
}
