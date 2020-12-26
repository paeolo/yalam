const {
  pipe,
} = require('@yalam/core');
const {
  source,
  destination,
  tap
} = require('@yalam/operators');

const task = pipe(
  source({ glob: 'src/**/*.ts' }),
  destination({ path: 'dist' })
);

module.exports = {
  default: task,
};
