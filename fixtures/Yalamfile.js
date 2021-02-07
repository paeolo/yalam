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
  createAsset(),
  tsCompiler.transpile({ syntaxCheck: false }),
  destination({ path: 'dist' })
);

module.exports = {
  ts
};
