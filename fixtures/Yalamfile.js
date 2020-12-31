const {
  pipe,
  concat,
} = require('@yalam/core');
const {
  source,
  destination,
} = require('@yalam/operators');
const { babel } = require('@yalam/babel');
const { generateTypes } = require('@yalam/typescript')

const transpile = pipe(
  source({ glob: 'src/**/*.ts' }),
  babel(),
  destination({ path: 'dist' })
);

const dtsGeneration = pipe(
  source({ glob: 'src/**/*.ts' }),
  generateTypes(),
  destination({ path: 'dist' })
);

module.exports = {
  default: concat(
    transpile,
    dtsGeneration
  ),
};
