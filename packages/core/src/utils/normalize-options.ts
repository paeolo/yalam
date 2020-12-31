import { YalamOptions } from "../yalam";
import {
  CACHE_DIR,
  CACHE_KEY
} from '../constants';

export const normalizeOptions = (options: YalamOptions): Required<YalamOptions> => ({
  disableCache: options.disableCache || false,
  cacheDir: options.cacheDir || CACHE_DIR,
  cacheKey: options.cacheKey || CACHE_KEY,
  reporters: options.reporters || [],
  concurrency: options.concurrency || 50
});
