import ts from 'typescript';
import {
  DirectoryPath,
  FileEvent,
} from '@yalam/core';

import {
  TSTranspiler
} from './transpiler';
import {
  AssetTranspiler
} from './asset-transpiler';
import {
  VersionRegistry
} from './version-registry';

export class TranspilerRegistry {
  private documentRegistry: ts.DocumentRegistry;
  private transpilers: Map<DirectoryPath, TSTranspiler>;
  private assetTranspilers: Map<DirectoryPath, AssetTranspiler>;
  private versionRegistry: VersionRegistry;

  constructor() {
    this.documentRegistry = ts.createDocumentRegistry();
    this.transpilers = new Map();
    this.assetTranspilers = new Map();
    this.versionRegistry = new VersionRegistry();
  }

  public getTSTranspiler(entry: DirectoryPath) {
    let transpiler = this.transpilers.get(entry);

    if (transpiler) {
      return transpiler;
    }

    transpiler = new TSTranspiler({
      entry,
      registry: this.documentRegistry,
      versionRegistry: this.versionRegistry
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

  public notify(events: FileEvent[]) {
    if (events.length === 0) {
      return;
    }

    this.versionRegistry.updateVersion(events[0]);
    this.getTSTranspiler(events[0].entry).notify(events);
  }
}
