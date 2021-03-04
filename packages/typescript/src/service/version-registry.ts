import path from 'path';
import resolve from 'resolve';
import {
  DirectoryPath, FilePath
} from '@yalam/core';
import { ImmutableEvent } from '@yalam/core/src/events';

const INITAL_VERSION = 0;

export class VersionRegistry {
  private resolutions: Map<DirectoryPath, DirectoryPath>;
  private versions: Map<DirectoryPath, number>;
  private directories: DirectoryPath[];

  constructor() {
    this.resolutions = new Map();
    this.versions = new Map();
    this.directories = [];
  }

  public updateVersion(event: ImmutableEvent) {
    const {
      pkg_name,
      entry
    } = event;
    let resolution = this.resolutions.get(entry);

    if (!resolution) {
      resolution = path.dirname(
        resolve.sync(path.join(pkg_name, 'package.json'), { preserveSymlinks: true })
      );
      this.resolutions.set(entry, resolution);
      this.directories.push(resolution);
    }

    this.versions.set(
      resolution,
      (this.versions.get(resolution) || INITAL_VERSION) + 1
    );
  }

  public getVersion(filePath: FilePath) {
    const directory = this.directories.find(value => filePath.startsWith(value));

    if (directory) {
      return this.versions.get(directory)!;
    }
    else {
      return INITAL_VERSION;
    }
  }
}
