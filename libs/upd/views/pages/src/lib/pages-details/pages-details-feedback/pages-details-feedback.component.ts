import { Component, OnInit } from '@angular/core';
import { PagesDetailsFacade } from '../+state/pages-details.facade';

@Component({
  selector: 'app-page-details-feedback',
  templateUrl: './pages-details-feedback.component.html',
  styleUrls: ['./pages-details-feedback.component.css'],
})
export class PagesDetailsFeedbackComponent {
  dyfChart = this.pageDetailsService.dyfData$;
  whatWasWrongChart = this.pageDetailsService.whatWasWrongData$;

  constructor(private pageDetailsService: PagesDetailsFacade) {}
}