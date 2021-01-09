const {
  pipe,
} = require('@yalam/core');
const {
  source,
  destination,
} = require('@yalam/operators');
const { createTSCompiler } = require('@yalam/typescript');

const tsCompiler = createTSCompiler();

const ts = pipe(
  source({ glob: 'src/**/*.ts' }),
  tsCompiler.compile(),
  destination({ path: 'dist' })
);

module.exports = {
  default: ts
};
