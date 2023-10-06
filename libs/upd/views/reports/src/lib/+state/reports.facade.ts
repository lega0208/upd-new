import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import * as ReportsActions from './reports.actions';
import * as ReportsSelectors from './reports.selectors';
import { combineLatest, map } from 'rxjs';

import { I18nFacade } from '@dua-upd/upd/state';
import { EN_CA, FR_CA } from '@dua-upd/upd/i18n';
import { AttachmentData } from '@dua-upd/types-common';
import { ColumnConfig } from '@dua-upd/upd-components';
import { createCategoryConfig } from '@dua-upd/upd/utils';

@Injectable()
export class ReportsFacade {
  /**
   * Combine pieces of state using createSelector,
   * and expose them as observables through the facade.
   */

  currentLang$ = this.i18n.currentLang$;

  loaded$ = this.store.select(ReportsSelectors.selectReportsLoaded);
  reportsData$ = this.store.select(ReportsSelectors.selectReportsData);

  tasksReports$ = combineLatest([this.reportsData$, this.currentLang$]).pipe(
    map(([reportsData, lang]) => {
      return (reportsData?.tasks || []).map((task) => {
        return {
          ...task,
          title: lang === EN_CA ? task.en_title : task.fr_title,
          en_filename: task.en_attachment[0]?.filename,
          fr_filename: task.fr_attachment[0]?.filename,
          en_attachment: task.en_attachment[0].storage_url,
          fr_attachment: task.fr_attachment[0].storage_url,
        };
      });
    })
  );

  tasksReportsColumns$ = this.i18n.currentLang$.pipe(
    map((lang) => {
      return [
        {
          field: 'title',
          header: this.i18n.service.translate('Title', lang),
        },
        {
          field: 'en_filename',
          header: this.i18n.service.translate('english-report', lang),
          type: 'link',
          typeParams: { link: 'en_attachment', external: true },
        },
        {
          field: 'fr_filename',
          header: this.i18n.service.translate('french-report', lang),
          type: 'link',
          typeParams: { link: 'fr_attachment', external: true },
        },
      ] as ColumnConfig[];
    })
  );

  projectsReports$ = combineLatest([this.reportsData$, this.currentLang$]).pipe(
    map(([data, lang]) => {
      if (!data?.projects) return [];

      return data.projects.flatMap((project) => {
        const baseTitle = project.title
          ? this.i18n.service.translate(
              project.title.replace(/\s+/g, ' '),
              lang
            )
          : '';

        return project.attachments.map((attachment, idx) => {
          const titleSuffix =
            project.attachments.length > 1 ? ` (${idx + 1})` : '';
          return {
            title: `${baseTitle}`, //${titleSuffix}
            startDate: project.startDate || '',
            status: project.status,
            cops: !!project.cops,
            filename: attachment.filename,
            url: attachment.storage_url,
          };
        });
      });
    })
  );

  projectsReportsColumns$ = combineLatest([
    this.projectsReports$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) => {
      return [
        {
          field: 'title',
          header: this.i18n.service.translate('ux_projects', lang),
        },
        {
          field: 'filename',
          header: this.i18n.service.translate('File link', lang),
          type: 'link',
          typeParams: { link: 'url', external: true },
        },
        {
          field: 'cops',
          header: this.i18n.service.translate('type', lang),
          type: 'label',
          typeParam: 'cops',
          filterConfig: {
            type: 'boolean',
          },
        },
        {
          field: 'status',
          header: this.i18n.service.translate('Status', lang),
          type: 'label',
          typeParam: 'status',
          filterConfig: {
            type: 'category',
            categories: createCategoryConfig({
              i18n: this.i18n.service,
              data,
              field: 'status',
            }),
          },
        },
        {
          field: 'startDate',
          header: this.i18n.service.translate('Start date', lang),
          pipe: 'date',
          pipeParam: lang === FR_CA ? 'd MMM YYYY' : 'MMM dd, YYYY',
        },
        // {
        //   field: 'lastAvgSuccessRate',
        //   header: this.i18n.service.translate('Average success rate', lang),
        //   pipe: 'percent',
        // },
      ] as ColumnConfig[];
    })
  );

  error$ = this.store.select(ReportsSelectors.selectReportsError);

  constructor(private readonly store: Store, private i18n: I18nFacade) {}

  /**
   * Use the initialization action to perform one
   * or more tasks in your Effects.
   */

  init() {
    this.store.dispatch(ReportsActions.loadReportsInit());
  }
}
