declare type FilePath = string;

declare module 'replace-homedir' {
  export default (filePath: FilePath, symbol: string) => string;
}
