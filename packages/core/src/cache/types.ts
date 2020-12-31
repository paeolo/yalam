import { AssetStatus } from "../types";

export interface CacheOptions {
  directory: string;
  cacheKey: string;
}

export interface BuiltFileInfo {
  status: AssetStatus.ARTIFACT,
  task: string;
  withSourceMap: boolean;
  sourcePath: string;
}

export interface DeletedFileInfo {
  status: AssetStatus.DELETED,
}

export interface FailedFileInfo {
  status: AssetStatus.FAILED,
  sourcePath: string;
}

export type FileInfo = BuiltFileInfo
  | DeletedFileInfo
  | FailedFileInfo;

export const enum CachedInfoType {
  BUILT,
  FAILED
}

export interface BuiltCachedInfo {
  type: CachedInfoType.BUILT,
  task: string;
  withSourceMap: boolean;
  sourcePath: string;
}

export interface FailedCachedInfo {
  type: CachedInfoType.FAILED,
  sourcePath: string;
}

export type CachedInfo = BuiltCachedInfo
  | FailedCachedInfo;

export type FilesTracker = Map<string, Map<string, FileInfo>>;

export const enum CacheType {
  ARTIFACTORY = 'artifactory',
  FILE_SYSTEM = 'file_system',
};
