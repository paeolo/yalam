const {
  pipe,
} = require('@yalam/core');
const {
  source,
  destination,
} = require('@yalam/operators');

const task = pipe(
  source({ glob: 'src/**/*.ts' }),
  destination({ path: 'dist' })
);

module.exports = {
  default: task,
};
