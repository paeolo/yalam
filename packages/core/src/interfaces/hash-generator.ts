export interface IHashGenerator {
  hash(value: string): Promise<string>;
}
