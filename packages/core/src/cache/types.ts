import { AssetStatus } from "../types";

export interface BuiltFileInfo {
  status: AssetStatus.ARTIFACT,
  task: string;
  withSourceMap: boolean;
  sourcePath: string;
}

export interface FailedFileInfo {
  status: AssetStatus.FAILED,
  sourcePath: string;
}

export interface DeletedFileInfo {
  status: AssetStatus.DELETED,
}

export type FileInfo = BuiltFileInfo
  | FailedFileInfo
  | DeletedFileInfo;

export type CachedInfo = BuiltFileInfo
  | FailedFileInfo;

export type FilesTracker = Map<string, Map<string, FileInfo>>;

export const enum CacheType {
  ARTIFACTORY = 'artifactory',
  FILE_SYSTEM = 'file_system',
};
