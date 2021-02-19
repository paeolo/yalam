import {
  DirectoryPath,
  Operator
} from '../../types';

export interface PipelineDictionary {
  [key: string]: Operator[];
};

export interface RegistryResult {
  cacheKey: string;
  fn: Operator[];
}

export interface GetPipelineOptions {
  pipeline: string;
  entry: DirectoryPath;
}

export interface IPipelineRegistry {
  getResult(options: GetPipelineOptions): Promise<RegistryResult>;
}
