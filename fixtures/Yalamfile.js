const { tap } = require('yalam/rxjs')

const task = (input) => {
  return input.pipe(
    tap(event => console.log(event.type, event.path))
  )
}

module.exports = {
  default: task,
};
