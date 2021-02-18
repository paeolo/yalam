import {
  DirectoryPath
} from "../../types";

export interface DependencyNode {
  name: string;
  entry: DirectoryPath;
  config: { [key: string]: string };
  dependencies: string[];
}
