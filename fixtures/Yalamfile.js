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
    tsCompiler.transpile(),
    tsCompiler.generateTypes()
  ),
  destination({ path: 'dist' })
);

const checkTypes = pipe(
  source({ glob: 'src/**/*.ts' }),
  tsCompiler.checkTypes()
);

module.exports = {
  default: ts,
  checkTypes
};
