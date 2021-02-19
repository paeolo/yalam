import {
  ErrorAsset,
} from '../../assets';
import {
  InputEvent
} from '../../types';

export interface IErrorRegistry {
  getErrors(): ErrorAsset[];
  onInput: (pipeline: string, events: InputEvent[]) => void;
  onError: (pipeline: string, error: ErrorAsset) => void;
  batchUpdate(): void;
};
