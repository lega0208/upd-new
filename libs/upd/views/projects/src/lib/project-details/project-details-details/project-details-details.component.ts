import { Component, OnInit } from '@angular/core';
import { ColumnConfig } from '@cra-arc/upd-components';
import { ProjectsDetailsFacade } from '../+state/projects-details.facade';
import { LocaleId } from '@cra-arc/upd/i18n';
import { I18nFacade } from '@cra-arc/upd/state';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-project-details-details',
  templateUrl: './project-details-details.component.html',
  styleUrls: ['./project-details-details.component.css'],
})
export class ProjectDetailsDetailsComponent implements OnInit {

  currentLang!: LocaleId;
  currentLang$ = this.i18n.currentLang$;

  memberList$ = this.projectsDetailsService.taskSuccessByUxTest$;

  memberListCols: ColumnConfig[] = [];

  ngOnInit(): void {
    this.i18n.service.onLangChange(({ lang }) => {
      this.currentLang = lang as LocaleId;
    });

    combineLatest([this.currentLang$]).subscribe(([lang]) => {
      this.memberListCols = [
        {
          field: 'role',
          header: this.i18n.service.translate('Role', lang),
        },
        {
          field: 'projectLead',
          header: this.i18n.service.translate('Name', lang)
        },
        {
          field: 'vendor',
          header: this.i18n.service.translate('Product', lang),
        }
      ];
    });
  }

  constructor(private readonly projectsDetailsService: ProjectsDetailsFacade, private i18n: I18nFacade) {}
}
