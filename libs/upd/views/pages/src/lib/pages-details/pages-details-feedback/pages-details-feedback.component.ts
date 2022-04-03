import { Component, OnInit } from '@angular/core';
import { PagesDetailsFacade } from '../+state/pages-details.facade';

@Component({
  selector: 'app-page-details-feedback',
  templateUrl: './pages-details-feedback.component.html',
  styleUrls: ['./pages-details-feedback.component.css'],
})
export class PagesDetailsFeedbackComponent {
  dyfChart = dyf;
  whatWasWrongChart = whatWasWrong;
  
  constructor(private pageDetailsService: PagesDetailsFacade) {}
}

const dyf = [
  { name: 'Yes', value: 76 },
  { name: 'No', value: 24 },
];

const whatWasWrong = [
  { name: "I can't find the info", value: 76 },
  { name: 'Other reason', value: 24 },
  { name: 'Info is hard to understand', value: 21 },
  { name: "Error/something didn't work", value: 32 },
];