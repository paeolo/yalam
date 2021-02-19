export interface GetHashOptions {
  entry: string;
  pipeline?: string;
  useCacheKey?: boolean
}

export interface IHashRegistry {
  getResult(options: GetHashOptions): Promise<string>;
}
