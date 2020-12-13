const { source } = require('yalam/operators');
const { tap } = require('yalam/rxjs')

const task = (input) => {
  return input.pipe(
    source({ glob: 'src/**/*.ts' }),
    tap(asset => console.log(asset.filePath))
  )
}

module.exports = {
  default: task,
};
