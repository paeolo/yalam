import ts from 'typescript';
import fs from 'fs';
import path from 'path';
import {
  FileAsset
} from '@yalam/core';
import {
  transform,
  TransformResult
} from '@yalam/operators';

import {
  FileExtension,
  isTypescript,
  replaceExtension
} from './utils';
import {
  FilePath
} from './types';
import {
  LanguageService
} from './service';
import { DocumentRegistry } from './registry';

export class TSCompiler {

  private registry: ts.DocumentRegistry;
  private services: Map<FilePath, LanguageService>

  constructor() {
    this.registry = new DocumentRegistry();
    this.services = new Map();
  }

  private generate = async (asset: FileAsset): Promise<TransformResult> => {
    const service = this.getLanguageService(asset.getEntry());
    const output = service
      .getEmitOutput(asset)
      .outputFiles
      .find(
        file => path.extname(file.name) === '.js'
      );

    if (!output) {
      throw new Error();
    }

    return {
      contents: Buffer.from(output.text)
    };
  }

  private getLanguageService(entry: FilePath) {
    let service = this.services.get(entry);

    if (service) {
      return service;
    }

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

    service = new LanguageService(
      JSON.parse(buffer.toString()).compilerOptions,
      this.registry
    );

    this.services.set(entry, service);
    return service;
  }

  public compile() {
    return transform({
      filter: isTypescript,
      getPath: replaceExtension(FileExtension.JS),
      getResult: this.generate.bind(this),
    })
  }
}

export const createTSCompiler = () => new TSCompiler();
