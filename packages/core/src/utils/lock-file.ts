import lockFile from 'lockfile';

export const lockFileAsync = (filePath: string, options: { wait: number }) =>
  new Promise<void>((resolve, reject) => {
    const lockPath = filePath.concat('.lock');
    lockFile.lock(lockPath, options, (err) => {
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
