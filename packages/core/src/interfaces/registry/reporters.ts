import {
  DeletedAsset,
  ErrorAsset,
  FileAsset
} from '../../assets';
import {
  InputEvent
} from '../../types';

export interface EventTypes {
  input: (task: string, events: InputEvent[]) => void;
  built: (task: string, asset: FileAsset) => void;
  deleted: (task: string, asset: DeletedAsset) => void;
  idle: (errors: ErrorAsset[]) => void;
}

export interface IReporterRegistry {
  onInput: (task: string, events: InputEvent[]) => void;
  onBuilt: (task: string, asset: FileAsset) => void;
  onDeleted: (task: string, asset: DeletedAsset) => void;
}
