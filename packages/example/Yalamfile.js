const {
  source,
  destination
} = require('yalam/operators');

const task = (input) => {
  return input.pipe(
    source({ glob: 'src/**/*.ts' }),
    destination({ path: 'dist' })
  )
}

module.exports = {
  default: task,
};
