import { FileAsset } from '@yalam/core';
import { oneToOne } from '@yalam/operators';

import {
  isTypescript,
  replaceExt
} from './utils';
import {
  CompilerService
} from './service';
import {
  OutputExtension,
  OutputType
} from './types';

interface TranspileOptions {
  type: OutputType;
  forceSyntaxCheck?: boolean;
};

export class TSCompiler {
  private service: CompilerService

  constructor() {
    this.service = new CompilerService();
  }

  private getEmittedOutput(options: TranspileOptions) {
    const getResult = async (asset: FileAsset) => {
      const syntaxCheck = options.forceSyntaxCheck
        || options.type === OutputType.JS;

      let sourceMap;
      const output = this.service
        .getTranspiler(asset.entry)
        .emitOutput(
          asset,
          options.type,
          syntaxCheck
        );

      if (!output.contents) {
        throw new Error();
      }

      if (output.sourceMap) {
        sourceMap = {
          map: JSON.parse(output.sourceMap.text)
        };
      }

      return {
        contents: Buffer.from(output.contents.text),
        sourceMap,
      }
    };

    const extension = options.type === OutputType.JS
      ? OutputExtension.JS
      : OutputExtension.DTS;

    return oneToOne({
      filter: isTypescript,
      getPath: replaceExt(extension),
      getResult,
    });
  }

  public transpile() {
    return this.getEmittedOutput({
      type: OutputType.JS
    });
  }

  public generateTypes(options?: { forceSyntaxCheck: boolean }) {
    return this.getEmittedOutput({
      type: OutputType.DTS,
      forceSyntaxCheck: options && options.forceSyntaxCheck
    });
  }
}

export const createTSCompiler = () => new TSCompiler();
