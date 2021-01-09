import ts, {
  CompilerOptions,
  DocumentRegistryBucketKey,
  IScriptSnapshot,
  Path,
  ScriptKind,
  SourceFile
} from 'typescript';

export class DocumentRegistry implements ts.DocumentRegistry {

  private registry: ts.DocumentRegistry;

  constructor() {
    this.registry = ts.createDocumentRegistry();
  }

  acquireDocument(
    fileName: string,
    compilationSettings: CompilerOptions,
    scriptSnapshot: IScriptSnapshot,
    version: string,
    scriptKind?: ScriptKind): SourceFile {
    return this.registry.acquireDocument(
      fileName,
      compilationSettings,
      scriptSnapshot,
      version,
      scriptKind
    )
  }

  acquireDocumentWithKey(
    fileName: string,
    path: Path,
    compilationSettings: CompilerOptions,
    key: DocumentRegistryBucketKey,
    scriptSnapshot: IScriptSnapshot,
    version: string,
    scriptKind?: ScriptKind): SourceFile {
    return this.registry.acquireDocumentWithKey(
      fileName,
      path,
      compilationSettings,
      key,
      scriptSnapshot,
      version,
      scriptKind,
    )
  }

  updateDocument(
    fileName: string,
    compilationSettings: CompilerOptions,
    scriptSnapshot: IScriptSnapshot,
    version: string,
    scriptKind?: ScriptKind): SourceFile {
    return this.registry.updateDocument(
      fileName,
      compilationSettings,
      scriptSnapshot,
      version,
      scriptKind,
    )
  }

  updateDocumentWithKey(
    fileName: string,
    path: Path,
    compilationSettings: CompilerOptions,
    key: DocumentRegistryBucketKey,
    scriptSnapshot: IScriptSnapshot,
    version: string,
    scriptKind?: ScriptKind): SourceFile {
    return this.registry.updateDocumentWithKey(
      fileName,
      path,
      compilationSettings,
      key,
      scriptSnapshot,
      version,
      scriptKind,
    )
  }

  getKeyForCompilationSettings(settings: CompilerOptions): DocumentRegistryBucketKey {
    return this.registry.getKeyForCompilationSettings(settings);
  }

  releaseDocument(fileName: string, compilationSettings: CompilerOptions): void {
    return this.registry.releaseDocument(fileName, compilationSettings);
  };

  releaseDocumentWithKey(path: Path, key: DocumentRegistryBucketKey): void {
    return this.registry.releaseDocumentWithKey(path, key);
  }
  reportStats(): string {
    return this.registry.reportStats();
  }
}
