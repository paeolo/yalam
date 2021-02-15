import path from 'path';
import ts from 'typescript';
import fs from 'fs';
import {
  DirectoryPath,
  EventType,
  FileEvent,
  FilePath
} from '@yalam/core';

import {
  formatDiagnostic,
  getTSConfigOrFail
} from '../utils';

const INITAL_VERSION = 0;

export interface TSTranspilerOptions {
  entry: DirectoryPath;
  registry: ts.DocumentRegistry;
}

export class TSTranspiler {
  private service: ts.LanguageService;
  private versions: Map<FilePath, number>;

  constructor(options: TSTranspilerOptions) {
    const tsConfig = getTSConfigOrFail(options.entry);
    const commandLine = ts.parseJsonSourceFileConfigFileContent(
      tsConfig,
      ts.sys,
      options.entry
    );

    this.versions = new Map();

    for (const filePath of commandLine.fileNames) {
      this.versions.set(filePath, INITAL_VERSION);
    }

    const serviceHost = this.getHost(
      options.entry,
      { ...commandLine.options, sourceMap: true }
    );

    this.service = ts.createLanguageService(
      serviceHost,
      options.registry
    );
  }

  private getHost(entry: DirectoryPath, compilerOptions: ts.CompilerOptions): ts.LanguageServiceHost {
    return {
      getScriptFileNames: () => this.getScriptFileNames(),
      getScriptVersion: filePath => this.getScriptVersion(filePath),
      getScriptSnapshot: filePath => this.getScriptSnapshot(filePath),
      getCurrentDirectory: () => entry,
      getCompilationSettings: () => compilerOptions,
      getDefaultLibFileName: ts.getDefaultLibFilePath,
      fileExists: ts.sys.fileExists,
      readFile: ts.sys.readFile,
      readDirectory: ts.sys.readDirectory,
      directoryExists: ts.sys.directoryExists,
      getDirectories: ts.sys.getDirectories,
    }
  }

  private getScriptFileNames() {
    return Array.from(this.versions.keys());
  }

  private getScriptVersion(filePath: FilePath) {
    return (this.versions.get(filePath) || INITAL_VERSION).toString();
  }

  private getScriptSnapshot(filePath: FilePath) {
    return ts.ScriptSnapshot
      .fromString(fs.readFileSync(filePath).toString())
  }

  private updateVersion(filePath: FilePath) {
    this.versions.set(
      filePath,
      (this.versions.get(filePath) || INITAL_VERSION) + 1
    );
  }

  private deleteVersion(filePath: FilePath) {
    this.versions.delete(filePath);
  }

  public notify(events: FileEvent[]) {
    for (const event of events) {
      if (event.type === EventType.DELETED) {
        this.deleteVersion(event.path)
      } else if (event.type === EventType.UPDATED) {
        this.updateVersion(event.path);
      }
    }
  }

  public failOnFirstError(filePath: FilePath, disableSemanticCheck?: boolean) {
    let diagnotics: ts.Diagnostic[] = this.service.getSyntacticDiagnostics(filePath);

    if (!disableSemanticCheck) {
      diagnotics = diagnotics.concat(this.service.getSemanticDiagnostics(filePath));
    }

    const diagnostic = diagnotics[0];

    if (!diagnostic) {
      return;
    }

    throw new Error(
      formatDiagnostic(diagnostic, filePath)
    );
  }

  public emitJavascript(event: FileEvent, disableSemanticCheck?: boolean) {
    const outputFiles = this.service
      .getEmitOutput(event.path)
      .outputFiles;

    this.failOnFirstError(event.path, disableSemanticCheck);

    return {
      contents: outputFiles.find(
        file => path.extname(file.name) === '.js'
      )!,
      sourceMap: outputFiles.find(
        file => path.extname(file.name) === '.map'
      )!
    }
  }

  public emitDTS(fileName: FilePath) {
    const outputFiles = this.service
      .getEmitOutput(fileName, true, true)
      .outputFiles;

    return {
      contents: outputFiles.find(
        file => path.extname(file.name) === '.ts'
      )!
    }
  }
}
