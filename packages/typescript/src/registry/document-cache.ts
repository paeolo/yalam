import ts from 'typescript';
import crypto, { BinaryToTextEncoding } from 'crypto';
import mkdirp from 'mkdirp';
import path from 'path';

const CACHE_DIR = 'typescript';

export interface DocumentCacheOptions {
  cacheDir: string;
}

export const md5 = (value: string, encoding: BinaryToTextEncoding = 'hex') => {
  return crypto
    .createHash('md5')
    .update(value)
    .digest(encoding)
    .substring(0, 10);
}

/**
 * @todo
 * NOT WORKING YET.
 * See https://github.com/microsoft/TypeScript/issues/33502.
 */
export class DocumentCache implements ts.ExternalDocumentCache {

  private cacheDir: string;

  constructor(options: DocumentCacheOptions) {
    this.cacheDir = path.resolve(
      path.join(options.cacheDir, CACHE_DIR)
    );
    mkdirp.sync(this.cacheDir);
  }

  getDocument(key: ts.DocumentRegistryBucketKey, filePath: ts.Path): ts.SourceFile | undefined {
    return undefined;
  }

  setDocument(key: ts.DocumentRegistryBucketKey, filePath: ts.Path, sourceFile: ts.SourceFile) {
  }
}
