import path from 'path';
import fsAsync from 'fs/promises';
import fs from 'fs';

import {
  DirectoryPath
} from '../types'

export const existsOrFail = async (entry: DirectoryPath) => {
  const directory = path.resolve(entry);
  try {
    await fsAsync.access(directory, fs.constants.F_OK);
  } catch {
    throw new Error(`Directory not found: ${entry}`)
  }
}
