import { map, Observable } from 'rxjs';
import type { I18nService } from '@dua-upd/upd/i18n';
import type { ColumnConfig } from '@dua-upd/types-common';

/**
 * @description Returns an Observable that emits the ColumnConfigs with translated headers
 * @param i18n I18nService
 * @param colConfigs ColumnConfig<T>[] with the header property being the translation key
 */
export function createColConfigWithI18n<T = never>(
  i18n: I18nService,
  colConfigs: ColumnConfig<T>[]
): Observable<ColumnConfig<T>[]> {
  const headerKeys = colConfigs.map((colConfig) => colConfig.header);

  return i18n.observeKeys(headerKeys).pipe(
    map((headers): ColumnConfig<T>[] =>
      colConfigs.map((colConfig) => ({
        ...colConfig,
        header: headers[colConfig.header],
      }))
    )
  );
}
