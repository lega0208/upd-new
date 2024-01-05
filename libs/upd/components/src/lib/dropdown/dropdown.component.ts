import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Required } from '@dua-upd/utils-common';

export interface DropdownOption<T> {
  label: string;
  value: T;
  styleClasses?: string;
  icon?: string;
}

@Component({
  selector: 'upd-dropdown',
  template: `
    <p-dropdown (onChange)="handleSelect($event.value)" [options]="options" optionLabel="label" optionValue="value">
        <ng-template pTemplate="selectedItem">
          <div style="color: rgb(33, 37, 41);">
          <span
            *ngIf="icon"
            class="material-icons align-top pe-1 "
            aria-hidden="true"
          >{{ icon }}</span
          >
            <span class="dropdown-label">{{ label || '' | translate }}</span>
          </div>
        </ng-template>

      <ng-template pTemplate="item" let-option>
        <div
          (click)="onSelect(option.value)"
          [class]="option.styleClasses || ''"
        >
          <span
            *ngIf="option.icon"
            class="pe-1 pi pi-{{ option.icon }} me-2"
            aria-hidden="true"
          ></span
          >{{ option.label | translate }}
        </div>
      </ng-template>
    </p-dropdown>


  `,
  styles: [
    `
      .dropdown-height {
        height: 42px;
      }
      .dropdown-label {
        font-family: 'Noto Sans', sans-serif;
        font-size: 1rem;
      }
    `,
  ]
})
export class DropdownComponent<T> {
  @Input() @Required id!: string;
  @Input() label: string | null = '';
  @Input() options: DropdownOption<T>[] = [];
  @Input() display = 'inline-block';
  @Input() bg = 'white';
  @Input() styleClasses = '';
  @Input() icon?: string;
  @Input() value: T | null = null;
  @Input() onSelect: (value: T) => void = (value: T) => console.log(value);
  @Output() selectedValueChange: EventEmitter<T> = new EventEmitter<T>();

  handleSelect(optionValue: T) {
    this.value = optionValue; 
    this.selectedValueChange.emit(this.value); 
  }
}
