# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.4] - 2021-02-21

### Added

- @yalam/operators add glob option to task operator.

## [0.2.3] - 2021-02-19

### Changed

- @yalam/core pipeline are renamed into operator.

### Added

- @yalam/core A pipeline is now an operator or an array of operators.

## [0.2.2] - 2021-02-19

### Changed

- @yalam/core Task are renamed into Pipeline.

### Added

- @yalam/operators has a new operator called task.

## [0.2.0] - 2021-02-18

### Added

- @yalam/core now run the build considering the dependency graph of packages.
- @yalam/typescript transpile task can now generate DTS files.

## [0.1.12] - 2021-02-13

### Added

- @yalam/typescript add disableSemanticCheck option.

## [0.1.11] - 2021-02-12

### Fixed

- Use ~ for package dependencies.

## [0.1.10] - 2021-02-11

### Added

- @yalam/cli can accepts globs as entries.

## [0.1.9] - 2021-02-11

### Changed

- Improve @yalam/typescript performances.

## [0.1.8] - 2021-02-03

### Changed

- In @yalam/reporter onBuilt and onDeleted print the basename of files.

### Fixed

- Fix @yalam/typescript checkTypes crash on deleted events.

## [0.1.7] - 2021-02-03

### Fixed

- Fix @yalam/core add sourceRoot to .map files.

## [0.1.6] - 2021-02-01

### Fixed

- Fix @yalam/babel use preset-env by default.

## [0.1.5] - 2021-01-31

### Fixed

- Fix @yalam/operators handle the case in oneToOne where the transformer emit nothing.

## [0.1.4] - 2021-01-31

### Fixed

- Fix @yalam/typescript set "rootDir" to undefined for asset-transpiler.

## [0.1.3] - 2021-01-31

### Fixed

- Fix @yalam/typescript didn't support the "extends" feature in tsconfig.json.

## [0.1.2] - 2021-01-31

### Fixed

- Fix @yalam/typescript "checkTypes".

## [0.1.1] - 2021-01-31

### Added

- Each package.json has now a reference to the github repository.

## [0.1.0] - 2021-01-30

### Added

- Initial version of Yalam.
