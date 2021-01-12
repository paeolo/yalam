const {
  pipe,
  dispatch,
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
  dispatch(
    tsCompiler.transpileToJS(),
    tsCompiler.transpileToDTS()
  ),
  destination({ path: 'dist' })
);

module.exports = {
  default: ts
};
