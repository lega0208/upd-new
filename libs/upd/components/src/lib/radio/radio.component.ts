import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ReportDimension } from '@dua-upd/types-common';

@Component({
  selector: 'upd-radio',
  templateUrl: './radio.component.html',
  styleUrls: ['./radio.component.scss'],
})
export class RadioComponent {
  @Input() items: ReportDimension[] = [];
  @Input() selectAllText = '';
  @Input() id?: string;
  @Input() selectedItems = '';
  @Input() disabled = false;

  @Output() selectedItemsChange = new EventEmitter<string>();

  updateIndividualSelection() {
    this.selectedItemsChange.emit(this.selectedItems);
  }
}