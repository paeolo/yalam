import ts from 'typescript';
import {
  DocumentCache,
  DocumentCacheOptions
} from './document-cache';

export const createRegistryWithCache = (options: DocumentCacheOptions) => {
  return ts.createDocumentRegistryInternal(
    undefined,
    undefined,
    new DocumentCache(options),
  )
}

export const createRegistry = () => {
  return ts.createDocumentRegistry();
}
