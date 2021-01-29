import crypto from 'crypto';

import {
  IHashGenerator
} from "../../interfaces";

export class HashGenerator implements IHashGenerator {
  public async hash(value: string) {
    return crypto
      .createHash('md5')
      .update(value)
      .digest('hex')
      .substring(0, 10);
  }
}
