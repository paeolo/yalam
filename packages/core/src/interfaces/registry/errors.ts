import {
  ErrorAsset,
} from '../../assets';
import {
  InputEvent
} from '../../types';

export interface IErrorRegistry {
  getErrors(): ErrorAsset[];
  onInput: (task: string, events: InputEvent[]) => void;
  onError: (task: string, error: ErrorAsset) => void;
  batchUpdate(): void;
};
