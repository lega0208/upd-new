import { I18nService } from '@dua-upd/upd/i18n';

export interface ConfigContext<T> {
  i18n: I18nService;
  data: T[];
  field: keyof T;
}

export function createCategoryConfig<T>(
  context: ConfigContext<T>
) {
  const categories = extractCategories(context.data, context.field);

  const currentLang = context.i18n.currentLang;
  const translate = (value: string) =>
    context.i18n.translate(value, currentLang);

  return categories.map((category) => ({
    name: translate(category) || category as string,
    value: category,
  }));
}

export function extractCategories<T>(data: T[], field: keyof T) {
  const categorySet = new Set<string>();

  for (const row of data) {
    const val = row[field];

    if (typeof val === 'string' && val !== '') {
      categorySet.add(val);
    }
  }

  return [...categorySet];
}
