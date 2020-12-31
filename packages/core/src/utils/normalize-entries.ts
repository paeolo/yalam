import path from 'path';
import fs from 'fs/promises';
import { constants } from 'fs';

export const existsOrFail = async (entry: string) => {
  const directory = path.resolve(entry);
  try {
    await fs.access(directory, constants.F_OK);
  } catch {
    throw new Error(`Directory not found: ${entry}`)
  }
}

const normalizeEntry = async (entry: string) => {
  await existsOrFail(entry);
  const directory = path.resolve(entry);
  const stats = await fs.lstat(directory);

  if (!stats.isDirectory()) {
    throw new Error(`Path is not a directory: ${entry}`)
  }

  return directory;
}

export const normalizeEntries = (entries: string[]) => {
  const promises = entries.map(normalizeEntry);
  return Promise.all(promises);
}
