import { Component, Input } from '@angular/core';

@Component({
  selector: 'upd-accordion',
  templateUrl: './accordion.component.html',
  styleUrls: ['./accordion.component.scss'],
})
export class AccordionComponent {
  @Input() title = 'view-data-table';
}
