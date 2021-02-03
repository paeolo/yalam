import ts from 'typescript';
import fs from 'fs';
import {
  DirectoryPath,
  EventType,
  FileEvent,
  FilePath
} from '@yalam/core';

import {
  formatDiagnostic
} from '../utils';

const INITAL_VERSION = 0;

export interface EventTranspilerOptions {
  config: any;
  entry: DirectoryPath;
  registry: ts.DocumentRegistry;
}

export class EventChecker {
  private entry: DirectoryPath;
  private compilerOptions: ts.CompilerOptions;
  private registry: ts.DocumentRegistry;
  private host: ts.LanguageServiceHost;
  private service: ts.LanguageService;
  private versions: Map<FilePath, number>;


  constructor(options: EventTranspilerOptions) {
    this.entry = options.entry;
    this.registry = options.registry;
    this.host = {
      getScriptFileNames: () => this.getScriptFileNames(),
      getScriptVersion: fileName => this.getScriptVersion(fileName),
      getScriptSnapshot: fileName => this.getScriptSnapshot(fileName),
      getCurrentDirectory: () => process.cwd(),
      getCompilationSettings: () => this.compilerOptions,
      getDefaultLibFileName: ts.getDefaultLibFilePath,
      fileExists: ts.sys.fileExists,
      readFile: ts.sys.readFile,
      readDirectory: ts.sys.readDirectory,
      directoryExists: ts.sys.directoryExists,
      getDirectories: ts.sys.getDirectories,
    }
    this.service = ts.createLanguageService(
      this.host,
      this.registry,
    );
    this.versions = new Map();

    const commandLine = ts.parseJsonConfigFileContent(
      options.config,
      ts.sys,
      this.entry
    );

    this.compilerOptions = commandLine.options;
    this.initVersion(commandLine);
  }

  private initVersion(commandLine: ts.ParsedCommandLine) {
    commandLine.fileNames.forEach(fileName => {
      this.versions.set(
        fileName,
        INITAL_VERSION
      );
    });
  }

  private getScriptFileNames() {
    return Array.from(this.versions.keys());
  }

  private getScriptVersion(fileName: FilePath) {
    return (this.versions.get(fileName) || INITAL_VERSION).toString();
  }

  private getScriptSnapshot(fileName: FilePath) {
    return ts.ScriptSnapshot
      .fromString(fs.readFileSync(fileName).toString())
  }

  private updateVersion(path: FilePath) {
    this.versions.set(
      path,
      (this.versions.get(path) || INITAL_VERSION) + 1
    );
  }

  private deleteVersion(path: FilePath) {
    this.versions.delete(path);
  }

  public checkTypes(event: FileEvent): Error | undefined {
    if (event.type === EventType.DELETED) {
      this.deleteVersion(event.path)
      return;
    }

    this.updateVersion(event.path);

    const diagnotics = this.service
      .getCompilerOptionsDiagnostics()
      .concat(this.service.getSyntacticDiagnostics(event.path))
      .concat(this.service.getSemanticDiagnostics(event.path));

    const diagnostic = diagnotics[0];

    if (!diagnostic) {
      return;
    }

    return new Error(formatDiagnostic(
      diagnostic,
      event.path
    ));
  }
}
