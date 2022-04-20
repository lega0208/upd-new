import { Component, OnInit } from '@angular/core';
import { ColumnConfig } from '@cra-arc/upd-components';
import { LocaleId } from '@cra-arc/upd/i18n';
import { I18nFacade } from '@cra-arc/upd/state';
import { combineLatest } from 'rxjs';
import { ProjectsDetailsFacade } from '../+state/projects-details.facade';

@Component({
  selector: 'app-project-details-feedback',
  templateUrl: './project-details-feedback.component.html',
  styleUrls: ['./project-details-feedback.component.css'],
})
export class ProjectDetailsFeedbackComponent implements OnInit {
  currentLang!: LocaleId;
  currentLang$ = this.i18n.currentLang$;

  visitsByPage$ =
    this.projectsDetailsService.visitsByPageFeedbackWithPercentChange$;
  visitsByPageCols: ColumnConfig[] = [];

  dyfChart$ = this.projectsDetailsService.dyfData$;
  whatWasWrongChart$ = this.projectsDetailsService.whatWasWrongData$;

  ngOnInit(): void {
    this.i18n.service.onLangChange(({ lang }) => {
      this.currentLang = lang as LocaleId;
    });

    combineLatest([this.currentLang$]).subscribe(([lang]) => {
      this.visitsByPageCols = [
        {
          field: 'url',
          header: 'Url',
          type: 'link',
          typeParams: { preLink: '/pages', link: '_id' },
        },
        {
          field: 'dyfYes',
          header: 'Yes',
          pipe: 'number',
          type: 'link',
          typeParams: {
            preLink: '/pages',
            link: '_id',
            postLink: 'pagefeedback',
          },
        },
        {
          field: 'dyfNo',
          header: 'No',
          pipe: 'number',
          type: 'link',
          typeParams: {
            preLink: '/pages',
            link: '_id',
            postLink: 'pagefeedback',
          },
        },

        {
          field: 'percentChange',
          header: this.i18n.service.translate('comparison', lang),
          pipe: 'percent',
        },
        {
          field: '0',
          header: '% of visitors who left feedback',
          pipe: 'percent',
        },
      ];
    });
  }

  constructor(
    private readonly projectsDetailsService: ProjectsDetailsFacade,
    private i18n: I18nFacade
  ) {}
}
