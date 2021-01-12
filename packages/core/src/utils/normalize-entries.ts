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

const normalizeEntry = async (entry: DirectoryPath) => {
  await existsOrFail(entry);
  const directory = path.resolve(entry);
  const stats = await fsAsync.lstat(directory);

  if (!stats.isDirectory()) {
    throw new Error(`Path is not a directory: ${entry}`)
  }

  return directory;
}

export const normalizeEntries = (entries: DirectoryPath[]) => {
  const promises = entries.map(normalizeEntry);
  return Promise.all(promises);
}
