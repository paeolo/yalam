import ts from 'typescript';
import fs from 'fs';

import {
  TranspilerService
} from ".";
import {
  FilePath
} from "../types";

export class CompilerService {
  private registry: ts.DocumentRegistry;
  private transpilers: Map<FilePath, TranspilerService>;

  constructor() {
    this.registry = ts.createDocumentRegistry();
    this.transpilers = new Map();
  }

  private getCompilerOptionsOrFail(entry: FilePath): ts.CompilerOptions {
    const configPath = ts.findConfigFile(
      entry,
      ts.sys.fileExists,
      'tsconfig.json'
    );

    if (!configPath) {
      throw new Error(
        `Could not find a valid "tsconfig.json" at ${entry}.`
      );
    }

    const buffer = fs.readFileSync(configPath);

    return JSON
      .parse(buffer.toString())
      .compilerOptions;
  }

  public getTranspiler(entry: FilePath) {
    let transpiler = this.transpilers.get(entry);

    if (transpiler)
      return transpiler;

    transpiler = new TranspilerService({
      compilerOptions: this.getCompilerOptionsOrFail(entry),
      registry: this.registry
    });

    this.transpilers.set(entry, transpiler);
    return transpiler;
  }
}
