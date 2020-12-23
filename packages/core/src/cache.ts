import path from 'path';
import mkdirp from 'mkdirp';

export default class Cache {
  private directory: string;

  constructor(directory: string) {
    this.directory = path.resolve(directory);
    mkdirp.sync(this.directory);
  }

  public get snapshot() {
    return path.join(this.directory, 'snapshot')
  }
}
