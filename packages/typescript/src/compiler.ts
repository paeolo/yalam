import ts from 'typescript';
import fs from 'fs';
import { FileAsset } from '@yalam/core';
import { oneToOne } from '@yalam/operators';

import {
  FileExtension,
  isTypescript,
  replaceExt
} from './utils';
import { FilePath } from './types';
import { TranspilerService } from './service';

export class TSCompiler {
  private registry: ts.DocumentRegistry;
  private services: Map<FilePath, TranspilerService>

  constructor() {
    this.registry = ts.createDocumentRegistry();
    this.services = new Map();
  }

  private getTranspilerService(entry: FilePath) {
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

    service = new TranspilerService({
      compilerOptions: JSON.parse(buffer.toString()).compilerOptions,
      registry: this.registry
    });

    this.services.set(entry, service);
    return service;
  }

  public transpileToJS() {
    const getResult = async (asset: FileAsset) => {
      const output = this
        .getTranspilerService(asset.entry)
        .getJavascript(asset);

      return {
        contents: Buffer.from(output.text)
      }
    };

    return oneToOne({
      filter: isTypescript,
      getPath: replaceExt(FileExtension.JS),
      getResult,
    });
  }

  public transpileToDTS() {
    const getResult = async (asset: FileAsset) => {
      const output = this
        .getTranspilerService(asset.entry)
        .getDTS(asset);

      return {
        contents: Buffer.from(output.text)
      }
    };

    return oneToOne({
      filter: isTypescript,
      getPath: replaceExt(FileExtension.DTS),
      getResult,
    });
  }
}

export const createTSCompiler = () => new TSCompiler();
