import ts from 'typescript';
import {
  FilePath
} from '@yalam/core';

import {
  TSTranspiler
} from './transpiler';

export class TranspilerRegistry {
  private documentRegistry: ts.DocumentRegistry;
  private transpilers: Map<FilePath, TSTranspiler>;

  constructor() {
    this.documentRegistry = ts.createDocumentRegistry();
    this.transpilers = new Map();
  }

  public getTSTranspiler(entry: FilePath) {
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
}
