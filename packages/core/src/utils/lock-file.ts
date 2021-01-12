import lockFile from 'lockfile';

const LOCK_EXTENSION = '.lock'

const WAIT_DURATION = 1000;
const STALE_DURATION = 1500;

export const lockFileAsync = (filePath: string) =>
  new Promise<void>((resolve, reject) => {
    const lockPath = filePath.concat(LOCK_EXTENSION);
    lockFile.lock(
      lockPath,
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
    const lockPath = filePath.concat(LOCK_EXTENSION);
    lockFile.unlock(lockPath, (err) => {
      if (err) {
        reject(err);
      }
      else {
        resolve();
      }
    })
  })
