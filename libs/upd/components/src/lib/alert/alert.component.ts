import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgbAlert } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'upd-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
})
export class AlertComponent implements OnInit {
  staticAlertClosed = false;

  @ViewChild('staticAlert', { static: false }) staticAlert!: NgbAlert;
  @Input() type: Type = 'success';
  @Input() secondsTimeout = 5;
  @Input() selfClosing = true;
  @Input() position: Position = 'static';
  @Input() dismissible = true;
  @Input() styleClass = '';
  style = '';

  ngOnInit(): void {
    if (this.selfClosing) {
      setTimeout(() => this.staticAlert.close(), this.secondsTimeout * 1000);
      this.staticAlertClosed = false;
    }

    this.getPosition();
  }

  getPosition() {
    if (this.position === 'top')
      this.style = 'position: fixed; top: 10px; width: 70%; z-index: 99999;';
    else if (this.position === 'bottom')
      this.style = 'position: fixed; bottom: 5px; width: 70%; z-index: 99999;';
  }
}

export type Type =
  | 'success'
  | 'info'
  | 'warning'
  | 'danger'
  | 'primary'
  | 'secondary'
  | 'light'
  | 'dark';

export type Position = 'static' | 'top' | 'bottom';
