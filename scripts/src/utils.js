const path = require('path');
const fs = require('fs');
const findUp = require('find-up');
const fg = require('fast-glob');

/**
 * @description
 * List of filtered packages using the lerna config
 */
const getPackages = async (filter) => {
  const entries = [];
  const rootPath = await findRootPath();
  const rootPKG = require(path.join(rootPath, 'package.json'));

  for (const glob of rootPKG.workspaces) {
    for (const entry of await getDirectories(path.join(rootPath, glob))) {
      if (filter(entry)) {
        entries.push(entry);
      }
    }
  }

  return {
    root: rootPath,
    packages: entries
  };
};

/**
 * @description
 * Returns the project root path and the lerna config
 */
const findRootPath = async () => {
  const rootPath = await findUp(async directory => {
    const pkgPATH = path.join(directory, 'package.json');
    const hasPKG = await findUp.exists(pkgPATH);

    if (!hasPKG) {
      return false;
    }

    const pkgJSON = require(pkgPATH);
    return pkgJSON.workspaces && directory;
  },
    { type: 'directory' }
  );

  if (!rootPath) {
    throw new Error(`Canno't find root path`)
  };

  return rootPath;
};

/**
 * @description
 * Check if the package contains a tsconfig.json
 */
const isPKGWithTSConfig = entry => {
  try {
    const TSConfigJSONPath = path.join(entry, 'tsconfig.json');
    fs.accessSync(TSConfigJSONPath, fs.constants.F_OK);
    return true;

  } catch (error) {
    return false;
  }
};

const getDirectories = async glob => fg(glob, { onlyDirectories: true });

module.exports = {
  getPackages,
  isPKGWithTSConfig
};
