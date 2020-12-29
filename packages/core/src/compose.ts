import rxjs from 'rxjs';
import { Task } from './types';

export const concat = (...tasks: Task[]): Task => (input) => rxjs.concat(
  ...tasks.map(task => task(input))
);

export const merge = (...tasks: Task[]): Task => (input) => rxjs.merge(
  ...tasks.map(task => task(input))
);
