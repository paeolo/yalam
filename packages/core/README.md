# Welcome to yalam 👋
![Version](https://img.shields.io/badge/version-0.1.7-blue.svg?cacheSeconds=2592000)
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
const { pipe, apply } = require('@yalam/core');
const { source, destination , createAsset } = require('@yalam/operators');
const { tsCompiler } = require('@yalam/typescript');

const ts = pipe(
    source({ glob: 'src/**/*' }),
    createAsset(),
    apply(['.ts'])(
        tsCompiler.transpile(),
        tsCompiler.generateTypes()
    ),
    destination({ path: 'dist' })
);

module.exports = {
    default: ts,
};
```

Here the `ts` pipeline will create a `.js` and a `.d.ts` asset for each `.ts` source file, using typescript.

### Package

Using the **CLI** provided by `@​yalam/cli`, you can build `packages` by providing a list like that:

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

As you can see, this `package.json` tells Yalam to use the `default` pipeline both for build mode and watch mode.

Note that you can mark a `package` to be skipped by using the value `"skip"` for the `yalam` field.

### Pipeline

**Pipeline**, also named **task**, is how you tell Yalam to do its job.

A pipeline is nothing else but an [operator](https://rxjs.dev/guide/operators "RXJS Operator"), ie. a function that map
an [observable](https://rxjs.dev/guide/observable "Observable") to an [observable](https://rxjs.dev/guide/observable "Observable").

So basically you can use all the power of [RxJS](https://rxjs.dev/guide/overview "RxJS") to construct your piplines.

A pipeline should map an observable of type `InputEvent` to an observable of type `Asset`.
This is directly inspired by how [Gulp](https://gulpjs.com/ "Gulp") works but the interface is a bit different.

Look at the `fixtures` folder to see examples of pipelines.

### Operator
To create your pipeline, you should use meta-operators that create an operator out of operators, and already existing operators.

- `@​yalam/core` exports some generic meta-operators: `pipe`, `apply`, `parallel` and `series`.
- `@​yalam/operators` exports some generic operators:  `source`, `sink`, `oneToOne`, `destination` and `createAsset`.
- `@​yalam/babel` exports operator `babel`.
- `@​yalam/typescript` exports operators `tsCompiler.transpile`, `tsCompiler.generateTypes` and `tsCompiler.checkTypes`.

### The futur
Yalam current target in mind is a NodeJS mono-repository for backend. But it could be extended to support more compilers and maybe
with enough contribution extends to an eco-system.

There is so much to do, create a `documentation`, create a `test suite`, create new operators for different compilers,
enable built-in support for `dependancy graphs`, ...

So if you are willing to contribute, don't hesitate to contact-me/open an issue!

Cheers.

PS: Yalam is a reference to [Golden Sun](https://www.youtube.com/watch?v=qNvaMC_DRPA "Golden Sun") .

## Author

👤 **Paul Le Couteur**
