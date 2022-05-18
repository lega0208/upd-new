import { Component, OnInit } from '@angular/core';
import { combineLatest } from 'rxjs';
import { ColumnConfig } from '@dua-upd/upd-components';
import { LocaleId } from '@dua-upd/upd/i18n';
import { I18nFacade } from '@dua-upd/upd/state';
import { ProjectsDetailsFacade } from '../+state/projects-details.facade';

@Component({
  selector: 'upd-project-details-details',
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
