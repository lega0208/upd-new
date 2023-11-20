import { TestBed } from '@angular/core/testing';
import { lastValueFrom, take } from 'rxjs';
import { I18nService, EN_CA, FR_CA, I18nModule } from '@dua-upd/upd/i18n';
import type { ColumnConfig } from '@dua-upd/upd-components';
import { createColConfigWithI18n } from './data-transform';

describe('data-transform', () => {
  let i18nService: I18nService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [I18nModule.forRoot()],
    });

    i18nService = TestBed.inject(I18nService);

    i18nService.addTranslations(EN_CA, {
      test1: 'test1_en',
      test2: 'test2_en',
    });

    i18nService.addTranslations(FR_CA, {
      test1: 'test1_fr',
      test2: 'test2_fr',
    });
  });

  it('should translate the headers', async () => {
    const config1 = {
      header: 'test1',
      field: 'test1Field',
      translate: true,
    } as ColumnConfig;

    const config2 = {
      header: 'test2',
      field: 'test2Field',
      pipe: 'date',
    } as ColumnConfig;

    const colConfigs = [config1, config2];

    const colConfigsWithI18n$ = createColConfigWithI18n(
      i18nService,
      colConfigs
    );

    await lastValueFrom(i18nService.use(FR_CA));

    const translatedConfigs = lastValueFrom(colConfigsWithI18n$.pipe(take(1)));

    const translatedHeader1 = translatedConfigs.then(
      (colConfigs) => colConfigs[0].header
    );

    const translatedHeader2 = translatedConfigs.then(
      (colConfigs) => colConfigs[1].header
    );

    await expect(translatedHeader1).resolves.toEqual('test1_fr');
    await expect(translatedHeader2).resolves.toEqual('test2_fr');

    await lastValueFrom(i18nService.use(EN_CA));

    const translatedConfigsEn = lastValueFrom(colConfigsWithI18n$.pipe(take(1)));

    const translatedHeaderEn1 = translatedConfigsEn.then(
      (colConfigs) => colConfigs[0].header
    );

    const translatedHeaderEn2 = translatedConfigsEn.then(
      (colConfigs) => colConfigs[1].header
    );

    await expect(translatedHeaderEn1).resolves.toEqual('test1_en');
    await expect(translatedHeaderEn2).resolves.toEqual('test2_en');
  });
});
