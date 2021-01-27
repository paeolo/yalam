import fsAsync from 'fs/promises';
import path from 'path';

export const getPKG = async (directory: string) => {
  const pkgPATH = path.join(directory, 'package.json');

  try {
    return JSON.parse(
      (await fsAsync.readFile(pkgPATH)).toString()
    );
  } catch {
    throw new Error(`"package.json" not found: ${directory}`)
  }
}
