const {
  parallel,
  pipe
} = require('@yalam/core');
const {
  createAsset,
  destination,
  source,
} = require('@yalam/operators');
const {
  babel
} = require('@yalam/babel');
const {
  tsCompiler
} = require('@yalam/typescript');

const ts = pipe(
  source({ glob: 'src/**/*.ts' }),
  createAsset(),
  babel(),
  destination({ path: 'dist' })
);

const checkTypes = pipe(
  source({ glob: 'src/**/*.ts' }),
  tsCompiler.checkTypes()
);

module.exports = {
  default: parallel(ts, checkTypes),
};
