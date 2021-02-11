import path from 'path';
import ts from 'typescript';
import fs from 'fs';
import {
  DirectoryPath,
  FilePath,
  FileAsset
} from '@yalam/core';

import {
  formatDiagnostic,
  getTSConfigOrFail
} from '../utils';

const INITAL_VERSION = 0;

export interface AssetTranspilerOptions {
  entry: DirectoryPath;
  registry: ts.DocumentRegistry;
}

interface Asset {
  file: FileAsset;
  version: number;
}
export class AssetTranspiler {
  private service: ts.LanguageService;
  private assets: Map<FilePath, Asset>;

  constructor(options: AssetTranspilerOptions) {
    const tsConfig = getTSConfigOrFail(options.entry);
    const commandLine = ts.parseJsonSourceFileConfigFileContent(
      tsConfig,
      {
        fileExists: ts.sys.fileExists,
        readDirectory: () => [],
        readFile: ts.sys.readFile,
        useCaseSensitiveFileNames: true,
      },
      options.entry
    );

    this.assets = new Map();

    const serviceHost = this.getHost(
      options.entry,
      { ...commandLine.options, rootDir: undefined, sourceMap: true }
    );

    this.service = ts.createLanguageService(
      serviceHost,
      options.registry
    );
  }

  private getHost(entry: DirectoryPath, compilerOptions: ts.CompilerOptions): ts.LanguageServiceHost {
    return {
      getScriptFileNames: () => this.getScriptFileNames(),
      getScriptVersion: fileName => this.getScriptVersion(fileName),
      getScriptSnapshot: fileName => this.getScriptSnapshot(fileName),
      getCurrentDirectory: () => entry,
      getCompilationSettings: () => compilerOptions,
      getDefaultLibFileName: ts.getDefaultLibFilePath,
    }
  }

  private getScriptFileNames() {
    return Array.from(this.assets.keys());
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
        .fromString(asset.file.contents.toString())
      : ts.ScriptSnapshot
        .fromString(fs.readFileSync(fileName).toString())
  }

  private storeAsset(file: FileAsset) {
    const fileName = file.distPath;
    const asset = this.assets.get(fileName);

    const version = asset
      ? asset.version + 1
      : INITAL_VERSION;

    this.assets.set(fileName, { file, version, });
  }

  private failOnFirstSyntacticError(asset: FileAsset) {
    const diagnotics = this.service.getSyntacticDiagnostics(asset.distPath);
    const diagnostic = diagnotics[0];

    if (!diagnostic) {
      return;
    }

    throw new Error(
      formatDiagnostic(diagnostic, asset.sourcePath)
    );
  }

  public emitJavascript(asset: FileAsset, disableSyntacticCheck?: boolean) {
    this.storeAsset(asset);

    const outputFiles = this.service
      .getEmitOutput(asset.distPath)
      .outputFiles;

    if (!disableSyntacticCheck) {
      this.failOnFirstSyntacticError(asset);
    }

    return {
      contents: outputFiles.find(
        file => path.extname(file.name) === '.js'
      )!,
      sourceMap: outputFiles.find(
        file => path.extname(file.name) === '.map'
      )!
    }
  }

  public emitDTS(asset: FileAsset) {
    this.storeAsset(asset);

    const outputFiles = this.service
      .getEmitOutput(asset.distPath, true, true)
      .outputFiles;

    return {
      contents: outputFiles.find(
        file => path.extname(file.name) === '.ts'
      )!
    }
  }
}
