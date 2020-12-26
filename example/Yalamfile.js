const {
  source,
  destination,
  delay,
} = require('@yalam/operators');

const task = (input) => {
  return input.pipe(
    source({ glob: 'src/**/*.ts' }),
    delay(500),
    destination({ path: 'dist' })
  )
}

module.exports = {
  default: task,
};
