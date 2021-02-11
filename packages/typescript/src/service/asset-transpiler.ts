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

export class AssetTranspiler {
  private service: ts.LanguageService;
  private currentAsset: FileAsset | undefined;
  private currentVersion: number = INITAL_VERSION;

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
    return this.currentAsset
      ? [this.currentAsset.distPath]
      : [];
  }

  private getScriptVersion(fileName: FilePath) {
    return this.currentAsset && fileName === this.currentAsset.distPath
      ? this.currentVersion.toString()
      : INITAL_VERSION.toString();
  }

  private getScriptSnapshot(fileName: FilePath) {
    return this.currentAsset && fileName === this.currentAsset.distPath
      ? ts.ScriptSnapshot
        .fromString(this.currentAsset.contents.toString())
      : ts.ScriptSnapshot
        .fromString(fs.readFileSync(fileName).toString());
  }

  private setAsset(asset: FileAsset) {
    this.currentAsset = asset;
    this.currentVersion++;
  }

  private free() {
    this.currentAsset = undefined;
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
    this.setAsset(asset);

    const outputFiles = this.service
      .getEmitOutput(asset.distPath)
      .outputFiles;

    if (!disableSyntacticCheck) {
      this.failOnFirstSyntacticError(asset);
    }

    this.free();

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
    this.setAsset(asset);

    const outputFiles = this.service
      .getEmitOutput(asset.distPath, true, true)
      .outputFiles;

    this.free();

    return {
      contents: outputFiles.find(
        file => path.extname(file.name) === '.ts'
      )!
    }
  }
}
