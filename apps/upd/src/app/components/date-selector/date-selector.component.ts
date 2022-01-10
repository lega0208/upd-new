import { Component, OnInit } from '@angular/core';
import { DateRange, DateSelectorService } from '../../services/date-selector/date-selector.service';

@Component({
  selector: 'app-date-selector',
  templateUrl: './date-selector.component.html',
  styleUrls: ['./date-selector.component.css']
})
export class DateSelectorComponent implements OnInit {
  dateRange: DateRange;

  constructor(private selectorService: DateSelectorService) {
    this.dateRange = this.selectorService.getPeriod();
  }

  ngOnInit(): void {
  }
}
