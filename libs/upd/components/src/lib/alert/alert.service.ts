import { Injectable } from '@angular/core';
import { CustomAlert } from './alert.component';

@Injectable({ providedIn: 'root' })
export class AlertServiceComponent {
  alerts: CustomAlert[] = [];

	show(alert: CustomAlert) {
    console.log('add alert', alert);
		this.alerts.push(alert);
	}

	remove(alert: CustomAlert) {
    console.log('remove alert', alert);
		this.alerts = this.alerts.filter((a) => a !== alert);
	}

	clear() {
		this.alerts.splice(0, this.alerts.length);
	}
}