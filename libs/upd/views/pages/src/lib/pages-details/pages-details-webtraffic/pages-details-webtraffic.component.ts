import { Component } from '@angular/core';
import { PagesDetailsFacade } from '../+state/pages-details.facade';

@Component({
  selector: 'app-page-details-webtraffic',
  templateUrl: './pages-details-webtraffic.component.html',
  styleUrls: ['./pages-details-webtraffic.component.css'],
})
export class PagesDetailsWebtrafficComponent {

  visitsByDay$ = this.pageDetailsService.visitsByDay$;
  
  whereVisitorsCameFrom$ = this.pageDetailsService.topSearchTermsIncrease$;
  whereVisitorsCameFromCols = [
    { field: 'url', header: 'Previous page URL' },
    { field: 'visits', header: 'Visits' },
    { field: 'change', header: 'Comparison' },
  ];

  whatVisitorsClickedOn$ = this.pageDetailsService.topSearchTermsIncrease$;
  whatVisitorsClickedOnCols = [
    { field: 'text', header: 'Text' },
    { field: 'clicks', header: 'Clicks' },
    { field: 'change', header: 'Comparison' },
  ];

  visitorLocation$ = this.pageDetailsService.visitorLocation$;
  visitorLocationCols = [
    { field: 'province', header: 'Province' },
    { field: 'value', header: 'Visits', pipe: 'number' },
    { field: 'change', header: 'Comparison' },
  ];

  constructor(private pageDetailsService: PagesDetailsFacade) {}
}
