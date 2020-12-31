const {
  pipe,
} = require('@yalam/core');
const {
  source,
  destination,
} = require('@yalam/operators');
const { babel } = require('@yalam/babel');

const task = pipe(
  source({ glob: 'src/**/*.ts' }),
  babel(),
  destination({ path: 'dist' })
);

module.exports = {
  default: task,
};
