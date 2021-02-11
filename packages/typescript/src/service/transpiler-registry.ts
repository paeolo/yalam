import ts from 'typescript';
import {
  DirectoryPath,
} from '@yalam/core';

import {
  TSTranspiler
} from './transpiler';
import {
  AssetTranspiler
} from './asset-transpiler';

export class TranspilerRegistry {
  private documentRegistry: ts.DocumentRegistry;
  private transpilers: Map<DirectoryPath, TSTranspiler>;
  private assetTranspilers: Map<DirectoryPath, AssetTranspiler>;

  constructor() {
    this.documentRegistry = ts.createDocumentRegistry();
    this.transpilers = new Map();
    this.assetTranspilers = new Map();
  }

  public getTSTranspiler(entry: DirectoryPath) {
    let transpiler = this.transpilers.get(entry);

    if (transpiler) {
      return transpiler;
    }

    transpiler = new TSTranspiler({
      entry,
      registry: this.documentRegistry,
    });

    this.transpilers.set(entry, transpiler);
    return transpiler;
  }

  public getAssetTranspiler(entry: DirectoryPath) {
    let transpiler = this.assetTranspilers.get(entry);

    if (transpiler) {
      return transpiler;
    }

    transpiler = new AssetTranspiler({
      entry,
      registry: this.documentRegistry,
    });

    this.assetTranspilers.set(entry, transpiler);
    return transpiler;
  }
}
