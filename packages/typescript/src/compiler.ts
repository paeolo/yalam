import {
  OperatorFunction,
  pipe,
  Observable,
  from
} from 'rxjs';
import {
  filter, map, mergeAll
} from 'rxjs/operators';
import {
  ErrorAsset,
  FileAsset,
  FileEvent
} from '@yalam/core';
import { oneToOne } from '@yalam/operators';

import {
  isTypescript,
  replaceExt
} from './utils';
import {
  TranspilerRegistry
} from './service';
import {
  OutputExtension,
  OutputType
} from './types';

interface TranspileAssetOptions {
  type: OutputType;
  syntaxCheck: boolean;
};

interface TranspileOptions {
  syntaxCheck?: boolean;
};

interface GenerateTypesOptions {
  forceSyntaxCheck?: boolean
}

export class TSCompiler {
  private registry: TranspilerRegistry

  constructor() {
    this.registry = new TranspilerRegistry();
  }

  private transpileAsset(options: TranspileAssetOptions) {
    const getResult = async (asset: FileAsset) => {
      const output = this.registry.getAssetTranspiler(asset.entry)
        .emitOutput(
          asset,
          options.type,
          options.syntaxCheck
        );

      if (!output.contents) {
        throw new Error();
      }

      let sourceMap;

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

  /**
 * @description
 * Emit a javascript file asset from your typescript asset.
 */
  public transpile(options?: TranspileOptions) {
    return this.transpileAsset({
      type: OutputType.JS,
      syntaxCheck: (options && options.syntaxCheck) || true
    });
  }

  /**
   * @description
   * Emit a declaration file asset from your typescript asset.
   */
  public generateTypes(options?: GenerateTypesOptions) {
    return this.transpileAsset({
      type: OutputType.DTS,
      syntaxCheck: (options && options.forceSyntaxCheck) || false
    });
  }

  /**
  * @description
  * Perform type-checking on your file events.
  */
  public checkTypes(): OperatorFunction<FileEvent, ErrorAsset> {
    const handleEvent = (event: FileEvent): Observable<ErrorAsset> => {
      const errors: ErrorAsset[] = [];
      const error = this.registry.getEventChecker(event.entry)
        .checkTypes(event);

      if (error) {
        errors.push(new ErrorAsset({
          error,
          event,
        }));
      }

      return from(errors);
    };

    return pipe(
      filter(event => isTypescript(event)),
      map(handleEvent),
      mergeAll()
    )
  }
}

export const createTSCompiler = () => new TSCompiler();
