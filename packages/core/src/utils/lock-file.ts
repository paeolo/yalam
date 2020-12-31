import lockFile from 'lockfile';

export const lockFileAsync = (filePath: string) =>
  new Promise<void>((resolve, reject) => {
    const lockPath = filePath.concat('.lock');
    lockFile.lock(
      lockPath,
      {
        wait: 1000,
        stale: 1500
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
    const lockPath = filePath.concat('.lock');
    lockFile.unlock(lockPath, (err) => {
      if (err) {
        reject(err);
      }
      else {
        resolve();
      }
    })
  })
