import {
  terminate
} from 'exits';

export const initTTY = () => {
  process.stdin.setRawMode(true);
  require('readline').emitKeypressEvents(process.stdin);

  process.stdin.on('keypress', async (char, key) => {
    if (!key.ctrl) {
      return;
    }

    if (key.name === 'c') {
      await terminate('exit', 0);
    }
  });
}
