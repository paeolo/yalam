import isGlob from 'is-glob';
import tinyGlob from 'tiny-glob/sync';

export const getEntries = (entries: string[]) => {
  const result = [];

  for (const entry of entries) {
    if (!isGlob(entry)) {
      result.push(entry);
    }
    else {
      tinyGlob(entry, { absolute: true, filesOnly: false })
        .forEach(value => result.push(value))
    }
  }

  return result;
}
