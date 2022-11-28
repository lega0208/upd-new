export interface PipelineConfig<T> {
  dataSources: Record<string, () => Promise<T[] | void>>;
  mergeBeforeInsert?: (
    allResults: Record<string, T[]>,
    context: Record<string, unknown>
  ) => T[];
  onBeforeInsert?: (
    data: T[],
    context: Record<string, unknown>
  ) => T[] | Promise<T[]>;
  insertFn: (data: T[], context: Record<string, unknown>) => Promise<void>;
  insertWithHooks?: boolean;
  onComplete?: (context: Record<string, unknown>) => Promise<void>;
}

export const assemblePipeline = <T>(
  pipelineConfig: PipelineConfig<T>,
  logger = console
) => {
  const {
    dataSources,
    mergeBeforeInsert,
    insertFn,
    onBeforeInsert,
    insertWithHooks,
    onComplete,
  } = pipelineConfig;

  const pipelineContext: Record<string, unknown> = {};

  if (mergeBeforeInsert) {
    return async () => {
      const dataSourceResults: {
        [Key in keyof typeof dataSources]?: T[];
      } = {};

      // execute in parallel and wait for all to finish
      const dataSourcePromises = Object.fromEntries(
        Object.entries(dataSources).map(([dataSourceKey, dataSource]) => [
          dataSourceKey,
          dataSource(),
        ])
      );
      await Promise.all(Object.values(dataSourcePromises));

      // then add unwrapped result promises into new results object
      for (const [resultKey, resultPromise] of Object.entries(
        dataSourcePromises
      )) {
        const result = await resultPromise;

        if (result) {
          dataSourceResults[resultKey] = result;
        }
      }

      const mergedResults = mergeBeforeInsert(
        dataSourceResults as Record<string, T[]>,
        pipelineContext
      );

      const finalResults =
        (await onBeforeInsert?.(mergedResults, pipelineContext)) ??
        mergedResults;

      await insertFn(finalResults, pipelineContext);

      return await onComplete?.(pipelineContext);
    };
  }

  if (insertWithHooks) {
    return async () => {
      const promises = Object.entries(dataSources).map(
        ([dataSourceName, dataSource]) =>
          dataSource().catch((err) => {
            console.error(`Error running ${dataSourceName} pipeline:`);
            console.error(err.stack);
          })
      );

      await Promise.all(promises);

      await onComplete?.(pipelineContext);

      return await Promise.resolve();
    };
  }

  return async () => {
    // parallelize dataSource pipelines
    const pipelines = Object.values(dataSources).map(async (dataSource) => {
      const dataSourceResults = await dataSource();

      const finalResults =
        (await onBeforeInsert?.(dataSourceResults || [], pipelineContext)) ??
        dataSourceResults;

      return insertFn(finalResults || [], pipelineContext);
    });

    const pipelineResults = await Promise.allSettled(pipelines);

    const pipelineErrorResults = pipelineResults
      .filter((result) => result.status === 'rejected')
      .map((result) => 'reason' in result && result.reason);

    if (pipelineErrorResults.length > 0) {
      logger.error('Errors while running data pipeline:');

      for (const err of pipelineErrorResults) {
        logger.error(err);
      }
    }

    return pipelineResults
      .filter((result) => result.status === 'fulfilled')
      .map((result) => 'value' in result && result.value);
  };
};
