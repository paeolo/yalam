import ts from 'typescript';
import fs from 'fs';
import {
  FileAsset
} from '@yalam/core';

import {
  FilePath
} from '../types';

const INITAL_VERSION = 0;

interface StoredAsset {
  value: FileAsset;
  version: number;
}

export interface LanguageServiceOptions {
  compilerOptions: ts.CompilerOptions;
  registry: ts.DocumentRegistry;
}

export class LanguageService {

  private compilerOptions: ts.CompilerOptions;
  private host: ts.LanguageServiceHost;
  private registry: ts.DocumentRegistry;
  private service: ts.LanguageService;
  private assets: Map<FilePath, StoredAsset>;

  constructor(options: LanguageServiceOptions) {
    this.compilerOptions = options.compilerOptions;
    this.registry = options.registry;
    this.host = {
      getScriptFileNames: () => this.getScriptFileNames(),
      getScriptVersion: fileName => this.getScriptVersion(fileName),
      getScriptSnapshot: fileName => this.getScriptSnapshot(fileName),
      getCurrentDirectory: () => process.cwd(),
      getCompilationSettings: () => this.compilerOptions,
      getDefaultLibFileName: ts.getDefaultLibFilePath,
    }
    this.service = ts.createLanguageService(
      this.host,
      this.registry,
    );
    this.assets = new Map();
  }

  private getScriptFileNames() {
    return Array.from(
      this.assets.keys()
    );
  }

  private getScriptVersion(fileName: FilePath) {
    const asset = this.assets.get(fileName);

    return asset
      ? asset.version.toString()
      : INITAL_VERSION.toString();
  }

  private getScriptSnapshot(fileName: FilePath) {
    const asset = this.assets.get(fileName);

    return asset
      ? ts.ScriptSnapshot
        .fromString(asset.value.getContentsOrFail().toString())
      : ts.ScriptSnapshot
        .fromString(fs.readFileSync(fileName).toString())
  }

  private getFirstSyntacticError(fileName: FilePath) {
    const diagnotics = this.service
      .getCompilerOptionsDiagnostics()
      .concat(this.service.getSyntacticDiagnostics(fileName));

    const diagnostic = diagnotics[0];

    if (!diagnostic) {
      return;
    }

    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
    if (diagnostic.file && diagnostic.start) {
      const {
        line,
        character
      } = diagnostic.file.getLineAndCharacterOfPosition(
        diagnostic.start
      );
      return new Error(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`)
    } else {
      return new Error(message);
    }
  }

  public getEmitOutput(asset: FileAsset, emitOnlyDtsFiles?: boolean) {
    const fileName = asset.getFullPath();
    const stored = this.assets.get(fileName);

    const version = stored
      ? stored.version + 1
      : INITAL_VERSION;

    this.assets.set(fileName, {
      value: asset,
      version,
    });

    const error = this.getFirstSyntacticError(fileName);

    if (error) {
      throw error;
    }

    return this.service.getEmitOutput(fileName);
  }
}
