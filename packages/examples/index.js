const fs = require('fs');
const Yalam = require('../dist').default;

const yalam = new Yalam();
yalam.add('default', (input) => input.pipe(
  tap(value => console.log(value)),
  finalize(() => console.log('finally'))
))

const main = async () => {
  const time = new Date();

  const sub = await yalam.watch({
    task: 'default',
    entries: ['fixtures/']
  });
  process.on('SIGINT', sub.unsubscribe);
  fs.utimesSync('fixtures/index.ts', time, time);
}

main();
