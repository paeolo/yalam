const path = require('path');
const assert = require('assert');
const fs = require('fs');
const commentJSON = require('comment-json');

const {
  getPackages,
  isPKGWithTSConfig
} = require('./utils');

const main = async () => {
  const { packages } = await getPackages(isPKGWithTSConfig);
  const map = createMap(packages);

  for (const key of map.keys()) {
    await updateReferences(key, map);
  }
}

const createMap = (packages) => {
  const map = new Map();

  for (const entry of packages) {
    const pkgJSONPath = path.join(entry, 'package.json');
    const pkgJSON = require(pkgJSONPath);
    const name = pkgJSON.name;

    assert(
      name,
      `Package ${entry} should have a name`
    );

    map.set(name, entry);
  }
  return map;
}

const updateReferences = async (entry, map) => {
  const references = new Set();

  const pkgPath = map.get(entry);
  const pkgJSONPath = path.join(pkgPath, 'package.json');
  const TSConfigJSONPath = path.join(pkgPath, 'tsconfig.json');
  const pkgJSON = require(pkgJSONPath);
  const keys = Array.from(map.keys());

  if (pkgJSON.dependencies) {
    Object.keys(pkgJSON.dependencies).forEach((key) => {
      if (keys.includes(key)) {
        references.add(key)
      }
    })
  }

  if (pkgJSON.devDependencies) {
    Object.keys(pkgJSON.devDependencies).forEach((key) => {
      if (keys.includes(key)) {
        references.add(key)
      }
    })
  }

  const tsConfigJSON = commentJSON.parse(
    fs.readFileSync(TSConfigJSONPath, "utf-8")
  );

  tsConfigJSON["references"] = Array.from(references).map((reference) => {
    return {
      path: path.relative(pkgPath, map.get(reference))
    };
  });

  fs.writeFileSync(
    TSConfigJSONPath,
    commentJSON.stringify(tsConfigJSON, null, 2),
    "utf-8"
  );
}

if (require.main === module) {
  main();
}
