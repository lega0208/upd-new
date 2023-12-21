import { Component, Input, OnInit, OnDestroy, OnChanges, ViewChild, ElementRef, ChangeDetectorRef, inject } from '@angular/core';
import { NgbAlert } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'upd-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
})
export class AlertComponent implements OnInit, OnDestroy, OnChanges {
  timeoutId?: number;
  alertKey = 0;

  @ViewChild('staticAlert', { static: false }) staticAlert!: NgbAlert;
  @ViewChild('staticAlert', { read: ElementRef }) alertElementRef!: ElementRef;

  @Input() type: Type = 'success';
  @Input() secondsTimeout = 5;
  @Input() selfClosing = true;
  @Input() position: Position = 'static';
  @Input() dismissible = true;
  @Input() styleClass = '';
  @Input() widthPercentage = 70;
  alertVisible = true; 
  style = '';

  ngOnInit(): void {
    this.updateAlert();
  }

  ngOnChanges(): void {
    this.updateAlert();
  }

  ngOnDestroy(): void {
    this.clearTimeout();
  }

  updateAlert(): void {
    this.alertVisible = true; // Ensure alert is visible
    this.clearTimeout();
    if (this.selfClosing) {
      this.timeoutId = setTimeout(() => this.closeAlert(), this.secondsTimeout * 1000) as unknown as number;
    }
    this.getPosition();
    this.focusAlert();
  }

  clearTimeout(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
  }

  getPosition(): void {
    switch (this.position) {
      case 'top':
        this.style = `position: fixed; top: 10px; width: ${this.widthPercentage}%; z-index: 99999;`;
        break;
      case 'bottom':
        this.style = `position: fixed; bottom: 5px; width: ${this.widthPercentage}%; z-index: 99999;`;
        break;
      default:
        this.style = '';
        break;
    }
  }

  focusAlert(): void {
    if (this.alertElementRef) {
      this.alertElementRef.nativeElement.focus();
    }
  }

  closeAlert(): void {
    this.alertVisible = false;
    this.clearTimeout();
  }

  onAlertClosed(): void {
    this.alertVisible = false;
  }
}

export type Type = 'success' | 'info' | 'warning' | 'danger' | 'primary' | 'secondary' | 'light' | 'dark';
export type Position = 'static' | 'top' | 'bottom';