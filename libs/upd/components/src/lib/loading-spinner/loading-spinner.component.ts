import { Component, Input, OnInit } from '@angular/core';

import { I18nFacade } from '@cra-arc/upd/state';

@Component({
  selector: 'app-loading-spinner',
  templateUrl: './loading-spinner.component.html',
  styleUrls: ['./loading-spinner.component.css'],
})
export class LoadingSpinnerComponent implements OnInit {
  constructor(private i18n:I18nFacade){}
  ngOnInit(): void {}
}
