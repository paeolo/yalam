const { tap } = require('yalam/rxjs')

const task = (input) => {
  return input.pipe(
    tap(event => console.log('BLOUP', event))
  )
}

module.exports = {
  default: task,
};
