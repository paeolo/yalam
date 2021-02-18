const {
  apply,
  pipe
} = require('@yalam/core');
const {
  createAsset,
  destination,
  source,
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

module.exports = {
  default: tsc,
};
