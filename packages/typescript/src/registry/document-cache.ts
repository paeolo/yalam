import ts from 'typescript';
import crypto, { BinaryToTextEncoding } from 'crypto';
import mkdirp from 'mkdirp';
import path from 'path';

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

export class DocumentCache implements ts.ExternalDocumentCache {

  private cacheDir: string;

  constructor(options: DocumentCacheOptions) {
    this.cacheDir = path.resolve(options.cacheDir);
    this.init();
  }

  private init() {
    mkdirp.sync(this.cacheDir);
  }

  getDocument(key: ts.DocumentRegistryBucketKey, path: ts.Path): ts.SourceFile | undefined {
    return undefined;
  }

  setDocument(key: ts.DocumentRegistryBucketKey, path: ts.Path, sourceFile: ts.SourceFile) {
  }
}
