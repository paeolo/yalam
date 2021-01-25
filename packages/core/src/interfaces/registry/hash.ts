export interface GetHashOptions {
  entry: string;
  task?: string;
  useCacheKey?: boolean
}

export interface IHashRegistry {
  getResult(options: GetHashOptions): Promise<string>;
}
