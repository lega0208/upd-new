import { Component, Input } from '@angular/core';
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
    <div ngbDropdown [class]="'d-' + display">
      <button
        [id]="id"
        class="btn bg-{{ bg }} border border-1 dropdown-toggle {{
          styleClasses
        }}"
        ngbDropdownToggle
      >
        <span
          *ngIf="icon"
          class="material-icons align-top pe-1"
          aria-hidden="true"
          >{{ icon }}</span
        >
        <span>{{ label || '' | translate }}</span>
      </button>
      <div ngbDropdownMenu [attr.aria-labelledby]="id" class="w-1">
        <button
          *ngFor="let option of options"
          (click)="onSelect(option.value)"
          ngbDropdownItem
          [class]="option.styleClasses || ''"
        >
          <span
            *ngIf="option.icon"
            class="pe-1 pi pi-{{ option.icon }} me-2"
            aria-hidden="true"
            ></span
          >{{ option.label | translate }}
        </button>
      </div>
    </div>
  `,
  styles: [],
})
export class DropdownComponent<T> {
  @Input() @Required id!: string;
  @Input() label: string | null = '';
  @Input() options: DropdownOption<T>[] = [];
  @Input() display = 'inline-block';
  @Input() bg = 'white';
  @Input() styleClasses = '';
  @Input() icon?: string;
  @Input() onSelect: (value: T) => void = (value) => console.log(value);
}
