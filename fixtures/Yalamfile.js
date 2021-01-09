const {
  pipe,
  dispatch,
  series
} = require('@yalam/core');
const {
  source,
  destination,
  tap,
  sink
} = require('@yalam/operators');
const { createTSCompiler } = require('@yalam/typescript');

const tsCompiler = createTSCompiler();

const ts = pipe(
  source({ glob: 'src/**/*.ts' }),
  tap(asset => console.log('dispatching', asset.path)),
  dispatch(
    pipe(
      tap(asset => console.log('this is a trap!', asset.path)),
      sink()
    ),
    pipe(
      tap(asset => console.log('compiling', asset.path)),
      tsCompiler.compile())
  ),
  destination({ path: 'dist' })
);

const dummy = pipe(
  tap(() => console.log('dummy!')),
  sink()
);

module.exports = {
  default: series(ts, dummy)
};
