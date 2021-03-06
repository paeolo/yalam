import {
  FileAsset,
  FileEvent
} from '@yalam/core';
import { pipe } from 'rxjs';
import { mergeAll, tap, toArray } from 'rxjs/operators'
import {
  checkEvent,
  oneToOne,
  transformEvent,
  IEventTransformer
} from '@yalam/operators';

import {
  isTypescript,
  replaceExt
} from './utils';
import {
  TranspilerRegistry
} from './service';

interface TranspileModuleOptions {
  disableSyntacticCheck?: boolean;
}

interface TranspileTSOptions {
  disableSemanticCheck?: boolean;
  disableDtsEmit?: boolean;
}

export class TSCompiler {
  private registry: TranspilerRegistry

  constructor() {
    this.registry = new TranspilerRegistry();
  }

  /**
* @description
* Emit a javascript file asset from your file events.
*/
  public transpile(options?: TranspileTSOptions) {
    const getResult = async (event: FileEvent) => {
      const output = this.registry
        .getTSTranspiler(event.entry)
        .emitJavascript(event, options?.disableSemanticCheck);

      return {
        contents: Buffer.from(output.contents.text),
        sourceMap: {
          map: JSON.parse(output.sourceMap.text)
        },
      }
    }

    const getDtsResult = async (event: FileEvent) => {
      const output = this.registry
        .getTSTranspiler(event.entry)
        .emitDTS(event);

      return {
        contents: Buffer.from(output.contents.text),
      }
    }

    const transformers: IEventTransformer[] = [
      {
        getPath: replaceExt('.js'),
        getResult
      }
    ];

    if (!options?.disableDtsEmit) {
      transformers.push({
        getPath: replaceExt('.d.ts'),
        getResult: getDtsResult
      })
    }

    return pipe(
      toArray<FileEvent>(),
      tap(events => this.registry.notify(events)),
      mergeAll(),
      transformEvent({
        filter: isTypescript,
        transformers
      })
    );
  }

  /**
  * @description
  * Perform type-checking on your file events.
  */
  public checkTypes() {
    const respondToEvent = async (event: FileEvent) => {
      this.registry
        .getTSTranspiler(event.entry)
        .failOnFirstError(event.path);
    }

    return pipe(
      toArray<FileEvent>(),
      tap(events => this.registry.notify(events)),
      mergeAll(),
      checkEvent({
        checkEvent: respondToEvent,
        filter: isTypescript
      })
    );
  }

  /**
   * @description
   * Emit a declaration file asset from your typescript asset.
   */
  public generateTypes() {
    const getResult = async (asset: FileAsset) => {
      const output = this.registry
        .getAssetTranspiler(asset.entry)
        .emitDTS(asset);

      return {
        contents: Buffer.from(output.contents.text),
      }
    }

    return oneToOne({
      filter: isTypescript,
      getPath: replaceExt('.d.ts'),
      getResult
    });
  }

  /**
  * @description
  * Emit a javascript file asset from your typescript asset.
  */
  public transpileModule(options?: TranspileModuleOptions) {
    const getResult = async (asset: FileAsset) => {
      const output = this.registry
        .getAssetTranspiler(asset.entry)
        .emitJavascript(asset, options?.disableSyntacticCheck);

      return {
        contents: Buffer.from(output.contents.text),
        sourceMap: {
          map: JSON.parse(output.sourceMap.text)
        },
      }
    }

    return oneToOne({
      filter: isTypescript,
      getPath: replaceExt('.js'),
      getResult
    });
  }
}

export const createTSCompiler = () => new TSCompiler();
