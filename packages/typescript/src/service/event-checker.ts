import ts from 'typescript';
import fs from 'fs';
import {
  DirectoryPath,
  FileEvent
} from '@yalam/core';

import {
  FilePath,
} from '../types';
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
  private config: any;
  private entry: DirectoryPath;
  private registry: ts.DocumentRegistry;
  private host: ts.LanguageServiceHost;
  private service: ts.LanguageService;
  private versions: Map<FilePath, number>;


  constructor(options: EventTranspilerOptions) {
    this.config = options.config;
    this.entry = options.entry;
    this.registry = options.registry;
    this.host = {
      getScriptFileNames: () => this.getScriptFileNames(),
      getScriptVersion: fileName => this.getScriptVersion(fileName),
      getScriptSnapshot: fileName => this.getScriptSnapshot(fileName),
      getCurrentDirectory: () => process.cwd(),
      getCompilationSettings: () => this.config.compilerOptions,
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
    this.init()
  }

  private init() {
    const commandLine = ts.parseJsonConfigFileContent(
      this.config,
      ts.sys,
      this.entry
    );

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

  private updateVersion(event: FileEvent) {
    const fileName = event.path;
    this.versions.set(
      fileName,
      (this.versions.get(fileName) || INITAL_VERSION) + 1
    );
  }

  public checkTypes(event: FileEvent): Error | undefined {
    this.updateVersion(event);

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
