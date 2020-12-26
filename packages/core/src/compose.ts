import {
  concat,
  merge,
} from 'rxjs';
import { Task } from './types';

export const series = (...tasks: Task[]): Task => (input) => concat(
  ...tasks.map(task => task(input))
);

export const parallel = (...tasks: Task[]): Task => (input) => merge(
  ...tasks.map(task => task(input))
);
