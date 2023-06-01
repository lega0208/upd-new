type InsertFunc<T> = (ops: T[]) => Promise<void>;

/**
 * Creates a queue that will perform queued updates when it reaches maxQueueSize
 * @param maxQueueSize
 * @param insertFunc
 */
export const createUpdateQueue = <T>(
  maxQueueSize: number,
  insertFunc: InsertFunc<T>
) => {
  const queue: T[] = [];

  const flush = async () => {
    const ops = queue.splice(0, queue.length);

    if (ops.length > 0) {
      await insertFunc(ops);
    }
  };

  const add = async (ops: T) => {
    if (queue.length >= maxQueueSize) {
      await flush();
    }

    queue.push(ops);
  };

  return {
    add,
    flush,
  };
};
