const {
  pipe,
} = require('@yalam/core');
const {
  source,
  createAsset,
  destination,
} = require('@yalam/operators');
const {
  tsCompiler
} = require('@yalam/typescript');

const ts = pipe(
  source({ glob: 'src/**/*.ts' }),
  createAsset(),
  tsCompiler.compile(),
  destination({ path: 'dist' })
);

module.exports = {
  default: ts
};
