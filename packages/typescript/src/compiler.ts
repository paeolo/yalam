import ts from 'typescript';
import fs from 'fs';
import path from 'path';
import {
  FileAsset
} from '@yalam/core';
import {
  oneToOne,
  OneToOneResult
} from '@yalam/operators';

import {
  FileExtension,
  isTypescript,
  replaceExt
} from './utils';
import { FilePath } from './types';
import { LanguageService } from './service';

export class TSCompiler {

  private registry: ts.DocumentRegistry;
  private services: Map<FilePath, LanguageService>

  constructor() {
    this.registry = ts.createDocumentRegistry();
    this.services = new Map();
  }

  private generate = async (asset: FileAsset): Promise<OneToOneResult> => {
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

    service = new LanguageService({
      compilerOptions: JSON.parse(buffer.toString()).compilerOptions,
      registry: this.registry
    });

    this.services.set(entry, service);
    return service;
  }

  public compile() {
    return oneToOne({
      filter: isTypescript,
      getPath: replaceExt(FileExtension.JS),
      getResult: this.generate.bind(this),
    })
  }
}

export const createTSCompiler = () => new TSCompiler();
