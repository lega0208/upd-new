import { Component, OnInit } from '@angular/core';
import { isEmpty } from 'rxjs/operators';
import { PagesDetailsFacade } from '../+state/pages-details.facade';

@Component({
  selector: 'app-page-details-feedback',
  templateUrl: './pages-details-feedback.component.html',
  styleUrls: ['./pages-details-feedback.component.css'],
})
export class PagesDetailsFeedbackComponent implements OnInit {
  dyfChart$ = this.pageDetailsService.dyfData$;
  whatWasWrongChart$ = this.pageDetailsService.whatWasWrongData$;

  ngOnInit(): void {
    const empty = this.dyfChart$.pipe(isEmpty());
    empty.subscribe((x) => console.log(x));
  }

  constructor(private pageDetailsService: PagesDetailsFacade) {}
}
