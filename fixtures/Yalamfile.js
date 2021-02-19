const path = require('path');
const {
  apply,
  pipe,
  series
} = require('@yalam/core');
const {
  createAsset,
  destination,
  source,
  task
} = require('@yalam/operators');
const {
  tsCompiler
} = require('@yalam/typescript');
const {
  babel
} = require('@yalam/babel')

const ts = pipe(
  source({ glob: 'src/**/*.ts' }),
  createAsset(),
  apply(['.ts'])(
    babel(),
    tsCompiler.generateTypes(),
  ),
  destination({ path: 'dist' })
);

const tsc = pipe(
  source({ glob: 'src/**/*.ts' }),
  tsCompiler.transpile(),
  destination({ path: 'dist' })
);

const printHello = task(
  (entry) => console.log('Hello', path.basename(entry))
)

module.exports = {
  default: series(tsc, printHello),
};
