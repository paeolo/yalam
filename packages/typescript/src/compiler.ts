import {
  FileEvent
} from '@yalam/core';
import {
  checkEvent
} from '@yalam/operators';

import {
  isTypescript,
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
    })
  }
}

export const createTSCompiler = () => new TSCompiler();
