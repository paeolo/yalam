import {
  FileEvent
} from '@yalam/core';
import {
  checkEvent,
  transformEvent,
} from '@yalam/operators';

import {
  isTypescript,
  replaceExt
} from './utils';
import {
  TranspilerRegistry
} from './service';

export class TSCompiler {
  private registry: TranspilerRegistry

  constructor() {
    this.registry = new TranspilerRegistry();
  }

  /**
* @description
* Emit a javascript file asset from your typescript asset.
*/
  public transpile() {
    const getResult = async (event: FileEvent) => {
      const transpiler = this.registry.getTSTranspiler(event.entry);
      transpiler.onEvent(event);
      const output = transpiler.emitJavascript(event);

      return {
        contents: Buffer.from(output.contents.text),
        sourceMap: {
          map: JSON.parse(output.sourceMap.text)
        },
      }

    }
    return transformEvent({
      filter: isTypescript,
      getPath: replaceExt('.js'),
      getResult
    });
  }

  /**
  * @description
  * Perform type-checking on your file events.
  */
  public checkTypes() {
    const respondToEvent = async (event: FileEvent) => {
      const transpiler = this.registry.getTSTranspiler(event.entry);
      transpiler.onEvent(event);
      transpiler.failOnFirstError(event.path);

    }
    return checkEvent({
      checkEvent: respondToEvent,
      filter: isTypescript
    });
  }
}

export const createTSCompiler = () => new TSCompiler();
