# Welcome to yalam 👋
![Version](https://img.shields.io/badge/version-0.2.4-blue.svg?cacheSeconds=2592000)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#)

> A Gulp-inspired incremental build system

### Feature Comparison

Here is a table comparing some javascript build systems:

| Feature         | Yalam         | Gulp  | Brunch |
| :-------------  |:-------------:|:-----:|:------:|
| opinionated     |               |       | ✓      |
| incremental     | ✓             |       | ✓      |
| pipeline-based  | ✓             | ✓     | ✓      |

### Architecture

Yalam is a Gulp-inspired **incremental** build system. The aim is to make your build purely incremental,
by using a caching strategy and a developper-friendly API.

### Yalamfile

Yalam is configured with a `Yalamfile.js`.
This file describes the list of pipelines that can be used to build your packages.

```javascript
const {
  pipe,
  apply
} = require('@yalam/core');
const {
  source,
  destination,
  createAsset
} = require('@yalam/operators');
const {
  tsCompiler
} = require('@yalam/typescript');

const ts = pipe(
  source({ glob: 'src/**/*' }),
  createAsset(),
  apply(['.ts'])(
    tsCompiler.transpileModule(),
    tsCompiler.generateTypes()
  ),
  destination({ path: 'dist' })
);

module.exports = {
  default: ts,
};
```

### Package

Using the **CLI** provided by **@​yalam/cli**, you can build your packages by providing a list like that:

```console
foo@bar:~$  yalam --watch example-1/ example-2/
```

Here a **package** is a folder containing a `package.json` file with a `config.yalam` field like for instance:

```json
{
    "name": "@yalam/example-1",
    "version": "1.0.0",
    "main": "dist/index.js",
    "config": {
        "yalam": {
            "build": "default",
            "watch": "default"
        }
    }
}
```

## Author

👤 **Paul Le Couteur**
