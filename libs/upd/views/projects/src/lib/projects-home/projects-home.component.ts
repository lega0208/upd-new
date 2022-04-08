import { Component, OnInit } from '@angular/core';
import { ProjectsHomeFacade } from './+state/projects-home.facade';
import { ColumnConfig } from '@cra-arc/upd-components';

@Component({
  selector: 'app-projects-home',
  templateUrl: './projects-home.component.html',
  styleUrls: ['./projects-home.component.css'],
})
export class ProjectsHomeComponent implements OnInit {
  data$ = this.projectsHomeService.projectsHomeData$;
  tableData$ = this.projectsHomeService.projectsHomeTableData$;
  
  numInProgress$ = this.projectsHomeService.numInProgress$;
  numCompletedLast6Months$ = this.projectsHomeService.numCompletedLast6Months$;
  totalCompleted$ = this.projectsHomeService.totalCompleted$;
  numDelayed$ = this.projectsHomeService.numDelayed$;

  columns: ColumnConfig[] = [
    {
      field: 'title',
      header: 'Name',
      type: 'link',
      typeParam: '_id',
      tooltip: 'tooltip',
    },
    {
      field: 'cops',
      header: 'Type',
      type: 'label',
      typeParam: 'cops',
      tooltip: 'tooltip',
    },
    {
      field: 'status',
      header: 'Status',
      type: 'label',
      typeParam: 'status',
      tooltip: 'tooltip',
    },
    {
      field: 'startDate',
      header: 'Start date',
      tooltip: 'tooltip',
      pipe: 'date',
    },
    {
      field: 'launchDate',
      header: 'Launch date',
      tooltip: 'tooltip',
      pipe: 'date',
    },
    {
      field: 'avgSuccessRate',
      header: 'Average test success rate',
      tooltip: 'tooltip',
      pipe: 'percent',
    }
  ];

  searchFields = this.columns.map((col) => col.field);


  constructor(private readonly projectsHomeService: ProjectsHomeFacade) {}

  ngOnInit() {
    this.projectsHomeService.init();
  }
}
