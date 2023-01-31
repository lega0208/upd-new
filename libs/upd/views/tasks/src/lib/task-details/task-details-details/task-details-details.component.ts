import { Component, OnInit } from '@angular/core';
import { TaskDetailsData } from '@dua-upd/types-common';
import { ColumnConfig } from '@dua-upd/upd-components';
import { I18nFacade } from '@dua-upd/upd/state';
import { combineLatest, Observable, of } from 'rxjs';
import { TasksDetailsFacade } from '../+state/tasks-details.facade';

@Component({
  selector: 'upd-task-details-details',
  templateUrl: './task-details-details.component.html',
  styleUrls: ['./task-details-details.component.css']
})
export class TaskDetailsDetailsComponent implements OnInit {

  currentLang$ = this.i18n.currentLang$;

  taskClassificationCols: ColumnConfig[] = [];

  taskClassificationData$:any = [];

  titleHeader$ = this.taskDetailsService.titleHeader$;
  group$ = this.taskDetailsService.group$;
  subgroup$ = this.taskDetailsService.subgroup$;
  topic$ = this.taskDetailsService.topic$;
  subtopic$ = this.taskDetailsService.subtopic$;
  program$ = this.taskDetailsService.program$;
  service$ = this.taskDetailsService.service$;
  userJourney$ = this.taskDetailsService.userJourney$;
  status$ = this.taskDetailsService.status$;
  channel$ = this.taskDetailsService.channel$;
  core$ = this.taskDetailsService.core$;
  userType$ = this.taskDetailsService.userType$;

  constructor(
    private readonly taskDetailsService: TasksDetailsFacade,
    private i18n: I18nFacade
  ) {}

  ngOnInit(): void {

    combineLatest([this.currentLang$]).subscribe(([lang]) => {
      this.taskClassificationCols = [
        { field: 'classification_type', header: this.i18n.service.translate('Classification Type', lang) },
        {
          field: 'description',
          header: this.i18n.service.translate('Description', lang),
        },
      ];
    });


    combineLatest([this.topic$, 
                  this.subtopic$, 
                  this.group$, 
                  this.subgroup$, 
                  this.channel$,
                  this.core$,
                  this.program$,
                  this.service$, 
                  this.userJourney$,
                  this.status$, 
                  this.currentLang$]).subscribe(([topic, subtopic, group, subgroup, channel, core, program, service, user_journey, status, lang]) => {
      return this.taskClassificationData$ = [
          { classification_type: this.i18n.service.translate('Topic', lang), description: topic.toString()},
          { classification_type: this.i18n.service.translate('Sub-topic', lang), description: subtopic.toString()},
          { classification_type: this.i18n.service.translate('Group', lang), description: group.toString()},
          { classification_type: this.i18n.service.translate('Sub-group', lang), description: subgroup.toString()},
          { classification_type: this.i18n.service.translate('Channel', lang), description: channel.toString()},
          { classification_type: this.i18n.service.translate('Core', lang), description: core.toString()},
          { classification_type: this.i18n.service.translate('Program', lang), description: program.toString()},
          { classification_type: this.i18n.service.translate('Service', lang), description: service.toString()},
          { classification_type: this.i18n.service.translate('User Journey', lang), description: user_journey.toString()},
          { classification_type: this.i18n.service.translate('Status', lang), description: status.toString()},
        ]
    })

  }

}