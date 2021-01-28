import ts from 'typescript';
import path from 'path';
import replace from 'replace-ext';
import { codeFrameColumns } from '@babel/code-frame';
import {
  ImmutableAsset
} from '@yalam/core';

import {
  OutputExtension
} from './types';

export const isTypescript = (asset: ImmutableAsset) => ['.ts']
  .includes(path.extname(asset.path));

export const replaceExt = (extension: OutputExtension) =>
  (asset: ImmutableAsset) => replace(asset.path, extension)

export const formatDiagnostic = (diagnostic: ts.Diagnostic, sourcePath?: string) => {
  const message = ts.flattenDiagnosticMessageText(
    diagnostic.messageText, "\n"
  );

  if (!diagnostic.file || !diagnostic.start) {
    return message;
  }

  const pos = diagnostic
    .file
    .getLineAndCharacterOfPosition(diagnostic.start);

  const line = pos.line + 1;
  const column = pos.character + 1;
  const location = { start: { line, column } };

  const error = `error TS${diagnostic.code}: ${message}`;
  const codeFrame = codeFrameColumns(diagnostic.file.text, location);

  if (!sourcePath) {
    return error
      .concat('\n')
      .concat('\n')
      .concat(codeFrame);
  }

  const source = `${sourcePath}:${line}:${column}`;

  return source
    .concat(' - ')
    .concat(error)
    .concat('\n')
    .concat('\n')
    .concat(codeFrame);
}
