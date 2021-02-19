import {
  DeletedAsset,
  ErrorAsset,
  FileAsset
} from '../../assets';
import {
  InputEvent
} from '../../types';

export interface EventTypes {
  input: (pipeline: string, events: InputEvent[]) => void;
  built: (pipeline: string, asset: FileAsset) => void;
  deleted: (pipeline: string, asset: DeletedAsset) => void;
  idle: (errors: ErrorAsset[]) => void;
}

export interface IReporterRegistry {
  onInput: (pipeline: string, events: InputEvent[]) => void;
  onBuilt: (pipeline: string, asset: FileAsset) => void;
  onDeleted: (pipeline: string, asset: DeletedAsset) => void;
}
