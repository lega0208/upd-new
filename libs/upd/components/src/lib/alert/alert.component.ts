import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgbAlert, NgbAlertConfig } from '@ng-bootstrap/ng-bootstrap';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-alert',
  template: `
      <ngb-alert *ngIf="!isClosed" (close)="isClosed=true">
        <ng-content></ng-content>
</ngb-alert>
  `,
  styleUrls: ['./alert.component.scss'],
  providers: [NgbAlertConfig],
})
export class AlertComponent implements OnInit {
  public open = true;
  private _success = new Subject<string>();
  @ViewChild('selfClosingAlert', { static: false }) selfClosingAlert!: NgbAlert;

  @Input() type = 'info';
  isClosed = false;

  constructor(alertConfig: NgbAlertConfig) {
    // customize default values of alerts used by this component tree
    alertConfig.type = 'success';
    alertConfig.dismissible = true;
  }

  ngOnInit(): void {
    setTimeout(() => this.selfClosingAlert.close(), 5000);
  }

  public changeSuccessMessage() { this._success.next(`${new Date()} - Message successfully changed.`); }

}
