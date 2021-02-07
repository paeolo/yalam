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
  tsCompiler
} = require('@yalam/typescript');

const ts = pipe(
  source({ glob: 'src/**/*.ts' }),
  tsCompiler.transpile(),
  destination({ path: 'dist' })
);

module.exports = {
  default: ts
};
