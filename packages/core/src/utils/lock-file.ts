import lockFile from 'lockfile';

const WAIT_DURATION = 1000;
const STALE_DURATION = 1500;

export const lockFileAsync = (filePath: string) =>
  new Promise<void>((resolve, reject) => {
    lockFile.lock(
      filePath,
      {
        wait: WAIT_DURATION,
        stale: STALE_DURATION
      },
      (err) => {
        if (err) {
          reject(err);
        }
        else {
          resolve();
        }
      })
  })

export const unlockFileAsync = (filePath: string) =>
  new Promise<void>((resolve, reject) => {
    lockFile.unlock(filePath, (err) => {
      if (err) {
        reject(err);
      }
      else {
        resolve();
      }
    })
  })
