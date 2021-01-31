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

const checkTypes = pipe(
  source({ glob: 'src/**/*.ts' }),
  tsCompiler.checkTypes()
);

module.exports = {
  default: parallel(ts, checkTypes),
};
