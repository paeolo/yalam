export const FILE_NOT_FOUND = (path: string) => new Error(`FILE NOT FOUND: ${path}`);
export const DIRECTORY_NOT_FOUND = (path: string) => new Error(`DIRECTORY NOT FOUND: ${path}`);
export const PATH_NOT_DIRECTORY = (path: string) => new Error(`NOT A DIRECTORY: ${path}`);
export const TASK_NOT_FUNCTION = (task: string) => new Error(`TASK NOT A FUNCTION: "${task}"`);
export const TASK_NOT_FOUND = (task: string) => new Error(`TASK NOT FOUND: "${task}"`);
