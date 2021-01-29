import ts from 'typescript';

declare module 'typescript' {
  export interface ExternalDocumentCache {
    setDocument(key: ts.DocumentRegistryBucketKey, path: ts.Path, sourceFile: ts.SourceFile): void;
    getDocument(key: ts.DocumentRegistryBucketKey, path: ts.Path): ts.SourceFile | undefined;
  }
  export function createDocumentRegistryInternal(
    useCaseSensitiveFileNames?: boolean,
    currentDirectory?: string,
    externalCache?: ExternalDocumentCache): ts.DocumentRegistry
}
