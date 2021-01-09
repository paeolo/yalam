import ts from 'typescript';
import fs from 'fs';
import {
  FileAsset
} from '@yalam/core';

import {
  FilePath
} from './types';

export class LanguageService {

  private options: ts.CompilerOptions;
  private host: ts.LanguageServiceHost;
  private registry: ts.DocumentRegistry;
  private service: ts.LanguageService;
  private assets: Map<FilePath, FileAsset>;
  private versions: Map<FilePath, number>;

  constructor(options: ts.CompilerOptions, registry: ts.DocumentRegistry) {
    this.options = options;
    this.host = {
      getScriptFileNames: () => this.getScriptFileNames(),
      getScriptVersion: fileName => this.getScriptVersion(fileName),
      getScriptSnapshot: fileName => this.getScriptSnapshot(fileName),
      getCurrentDirectory: () => process.cwd(),
      getCompilationSettings: () => this.options,
      getDefaultLibFileName: options => ts.getDefaultLibFilePath(options),
      fileExists: ts.sys.fileExists,
      readFile: ts.sys.readFile,
      readDirectory: ts.sys.readDirectory,
      directoryExists: ts.sys.directoryExists,
      getDirectories: ts.sys.getDirectories,
    }
    this.registry = registry;

    this.service = ts.createLanguageService(
      this.host,
      this.registry
    );
    this.assets = new Map();
    this.versions = new Map();
  }

  private getScriptFileNames() {
    return Array.from(
      this.assets.keys()
    );
  }

  private getScriptVersion(fileName: FilePath) {
    const version = this.versions.get(fileName);

    if (!version) {
      return '0';
    }

    return version.toString();
  }

  private getScriptSnapshot(fileName: FilePath) {
    const asset = this.assets.get(fileName);

    if (!asset) {
      return ts.ScriptSnapshot.fromString(
        fs.readFileSync(fileName).toString()
      );
    }

    return ts.ScriptSnapshot.fromString(
      asset.getContentsOrFail().toString()
    );
  }

  public getEmitOutput(asset: FileAsset) {
    const fullPath = asset.getFullPath();

    this.assets.set(fullPath, asset);
    const version = this.versions.get(fullPath) || 0;
    this.versions.set(fullPath, version + 1);

    return this.service.getEmitOutput(fullPath);
  }
}
