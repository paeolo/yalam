import ts from 'typescript';

import {
  FilePath
} from "../types";
import {
  getTSConfigOrFail
} from '../utils';
import {
  AssetTranspiler
} from './asset-transpiler';
import {
  EventChecker
} from './event-checker';

export class TranspilerRegistry {
  private documentRegistry: ts.DocumentRegistry;
  private assetTranspilers: Map<FilePath, AssetTranspiler>;
  private eventCheckers: Map<FilePath, EventChecker>;

  constructor() {
    this.documentRegistry = ts.createDocumentRegistry();
    this.assetTranspilers = new Map();
    this.eventCheckers = new Map();
  }

  public getAssetTranspiler(entry: FilePath) {
    let transpiler = this.assetTranspilers.get(entry);

    if (transpiler)
      return transpiler;

    transpiler = new AssetTranspiler({
      compilerOptions: getTSConfigOrFail(entry).compilerOptions,
      registry: this.documentRegistry,
    });

    this.assetTranspilers.set(entry, transpiler);
    return transpiler;
  }

  public getEventChecker(entry: FilePath) {
    let checker = this.eventCheckers.get(entry);

    if (checker)
      return checker;

    checker = new EventChecker({
      config: getTSConfigOrFail(entry),
      entry,
      registry: this.documentRegistry,
    });

    this.eventCheckers.set(entry, checker);
    return checker;
  }
}
