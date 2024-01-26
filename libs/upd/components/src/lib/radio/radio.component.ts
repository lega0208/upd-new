import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Required } from '@dua-upd/utils-common';

@Component({
  selector: 'upd-radio',
  templateUrl: './radio.component.html',
  styleUrls: ['./radio.component.scss'],
})
export class RadioComponent<
  T extends { value: string; label: string; description: string },
> {
  @Input() items: T[] = [];
  @Input() selectAllText = '';
  @Input() @Required id!: string;
  @Input() disabled = false;

  @Input() selectedItem?: T;
  @Output() selectedItemsChange = new EventEmitter<T>();

  onSelectionChange(item: T) {
    this.selectedItem = item;
    this.selectedItemsChange.emit(item);
  }
}
