import ts from 'typescript';
import path from 'path';
import fs from 'fs';
import {
  FileAsset
} from '@yalam/core';

import {
  FilePath, OutputType
} from '../types';

const INITAL_VERSION = 0;

interface Asset {
  file: FileAsset;
  version: number;
}

interface Emit {
  contents?: ts.OutputFile;
  sourceMap?: ts.OutputFile;
}

export interface TranspilerServiceOptions {
  compilerOptions: ts.CompilerOptions;
  registry: ts.DocumentRegistry;
}

export class TranspilerService {

  private compilerOptions: ts.CompilerOptions;
  private host: ts.LanguageServiceHost;
  private registry: ts.DocumentRegistry;
  private service: ts.LanguageService;
  private assets: Map<FilePath, Asset>;

  constructor(options: TranspilerServiceOptions) {
    this.compilerOptions = {
      ...options.compilerOptions,
      sourceMap: true
    };
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
        .fromString(asset.file.contents.toString())
      : ts.ScriptSnapshot
        .fromString(fs.readFileSync(fileName).toString())
  }

  private getFirstSyntacticError(asset: FileAsset) {
    const diagnotics = this.service
      .getCompilerOptionsDiagnostics()
      .concat(this.service.getSyntacticDiagnostics(asset.distPath));

    const diagnostic = diagnotics[0];

    if (!diagnostic) {
      return;
    }

    const message = ts.flattenDiagnosticMessageText(
      diagnostic.messageText, "\n"
    );

    if (diagnostic.file && diagnostic.start) {
      const {
        line,
        character
      } = diagnostic.file.getLineAndCharacterOfPosition(
        diagnostic.start
      );
      return new Error(`${asset.sourcePath} (${line + 1},${character + 1}): ${message}`)
    } else {
      return new Error(message);
    }
  }

  private storeAsset(asset: FileAsset) {
    const fileName = asset.distPath;
    const stored = this.assets.get(fileName);

    const version = stored
      ? stored.version + 1
      : INITAL_VERSION;

    this.assets.set(fileName, {
      file: asset,
      version,
    });
  }

  private getJavascript(fileName: FilePath) {
    const outputFiles = this.service
      .getEmitOutput(fileName)
      .outputFiles;

    return {
      contents: outputFiles.find(
        file => path.extname(file.name) === '.js'
      ),
      sourceMap: outputFiles.find(
        file => path.extname(file.name) === '.map'
      )
    }
  }

  private getDTS(fileName: FilePath) {
    const outputFiles = this.service
      .getEmitOutput(fileName, true, true)
      .outputFiles;

    return {
      contents: outputFiles.find(
        file => path.extname(file.name) === '.ts'
      ),
      sourceMap: undefined
    }
  }

  public emitOutput(asset: FileAsset, type: OutputType, checkSyntax: boolean): Emit {
    const fileName = asset.distPath;
    this.storeAsset(asset);

    if (checkSyntax) {
      const error = this.getFirstSyntacticError(asset);

      if (error) {
        throw error;
      }
    }

    const output = type === OutputType.JS
      ? this.getJavascript(fileName)
      : this.getDTS(fileName);

    return output;
  }
}
