import { StorageService } from './storage/storage.service';
import { catchError, combineLatest, lastValueFrom, map, mergeMap, Observable, tap, toArray } from 'rxjs';
import { ApiParams } from './api.service';
import { ServicesModule } from './services.module';

/*
 * todo:
 *  add expiration:
 *    -> add IndexedDB entry with keys and timestamps and prune expired entries periodically
 */

export interface ReturnedData<T> {
  dateRange: T;
  comparisonDateRange?: T;
}

export type GenericGet = <T extends ReturnedData<U>, U>(
  url: string,
  params: ApiParams
) => Observable<T>;

export function StorageCache(
  target: object,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod: GenericGet = descriptor.value;

  descriptor.value = function <T extends ReturnedData<U>, U>(
    url: string,
    params: ApiParams
  ): Observable<T> {
    const storage = ServicesModule.injector.get<StorageService>(StorageService);
    lastValueFrom(storage.clear()).then();
    const cacheKeyIdFragment = params?.id ? `_${params.id}` : '';
    const cacheKeyPrefix = `${url}${cacheKeyIdFragment}`;

    const keys$ = storage.observeKeys().pipe(toArray());

    // **** *** **
    //
    // todo: set up to return page metadata (id, title, url)
    //        - Probably just include in all?
    //
    // **** *** **
    return keys$.pipe(
      mergeMap((keys) => {
        const dateRangeCacheKey = `${cacheKeyPrefix}_${params.dateRange}`;
        const comparisonDateRangeCacheKey =
          params.comparisonDateRange &&
          `${cacheKeyPrefix}_${params.comparisonDateRange}`;

        const cacheHasAllData =
          keys.includes(dateRangeCacheKey) &&
          (comparisonDateRangeCacheKey
            ? keys.includes(comparisonDateRangeCacheKey)
            : true);

        if (cacheHasAllData && comparisonDateRangeCacheKey) {
          return combineLatest([
            storage.get(dateRangeCacheKey),
            storage.get(comparisonDateRangeCacheKey),
          ]).pipe(
            map(([data, comparisonData]) => {
              return {
                dateRange: data,
                comparisonDateRange: comparisonData,
              } as T;
            })
          );
        }

        if (cacheHasAllData) {
          return storage.get(dateRangeCacheKey).pipe(
            map((data) => {
              return data as T;
            })
          );
        }

        return (
          originalMethod.apply(this, [url, params]) as Observable<T>
        ).pipe(
          tap((data) => {
            lastValueFrom(storage.set(dateRangeCacheKey, data))
              .then(() => console.log('Saved data to cache key: ', dateRangeCacheKey));

            if (comparisonDateRangeCacheKey) {
              lastValueFrom(storage.set(comparisonDateRangeCacheKey, data))
                .then(() => console.log('Saved data to cache key: ', comparisonDateRangeCacheKey));
            }
          })
        );
      }),
      catchError((err) => {
        console.error(err);
        throw err;
      }),
    );
  };
}
