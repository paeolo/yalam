import PQueue from 'p-queue';
import {
  DependencyNode
} from '../interfaces';

export type GraphRunner<T> = (dependency: DependencyNode) => Promise<T>;

export class QueryGraph {
  private nodes: Map<string, DependencyNode>;
  private pendingCount: number;

  constructor(dependencies: DependencyNode[]) {
    this.nodes = new Map();
    this.pendingCount = 0;

    for (const dependency of dependencies) {
      this.nodes.set(dependency.name, dependency)
    }
  }

  public getLeaves() {
    const nodes: DependencyNode[] = [];

    this.nodes.forEach(node => {
      if (node.dependencies.length === 0) {
        nodes.push(node);
      }
    });

    if (this.pendingCount === 0 && nodes.length === 0 && this.nodes.size !== 0) {
      let node: DependencyNode = this.nodes.values().next().value;
      const stack: string[] = [];

      while (!stack.includes(node.name)) {
        stack.push(node.name);
        node = this.nodes.get(node.dependencies[0])!;
      }

      stack.push(node.name);

      throw new Error(
        `Dependency cycle detected: ${stack.join(' -> ')}`
      );
    }

    return nodes;
  }

  public markAsTaken(name: string) {
    this.pendingCount += 1;
    this.nodes.delete(name);
  }

  public markAsDone(name: string) {
    this.nodes.forEach(
      value => value.dependencies = value.dependencies.filter(
        item => item !== name
      )
    );
    this.pendingCount -= 1;
  }
}

/**
 * @description
 * Call a runner function on each dependency by respecting the dependency graph
 * @see
 * https://github.com/lerna/lerna/blob/main/utils/run-topologically/run-topologically.js
 */
export const runTopologically = <T>(dependencies: DependencyNode[], runner: GraphRunner<T>): Promise<T[]> => {
  const queue = new PQueue();
  const graph = new QueryGraph(dependencies);

  return new Promise((resolve, reject) => {
    const returnValues: T[] = [];

    const queueNextAvailablePackages = () =>
      graph.getLeaves().forEach(dependency => {
        graph.markAsTaken(dependency.name);
        queue.add(() =>
          runner(dependency)
            .then((value) => returnValues.push(value))
            .then(() => graph.markAsDone(dependency.name))
            .then(() => queueNextAvailablePackages())
        )
          .catch(reject);
      });

    queueNextAvailablePackages();
    return queue.onIdle().then(() => resolve(returnValues));
  });
}
