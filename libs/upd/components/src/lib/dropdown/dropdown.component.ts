import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Required } from '@dua-upd/utils-common';

export interface DropdownOption<T> {
  label: string;
  value: T | null;
  styleClasses?: string;
  icon?: string;
}

@Component({
  selector: 'upd-dropdown',
  template: `
    <p-dropdown
      [options]="options"
      optionLabel="label"
      [(ngModel)]="selectedOption"
      (onChange)="this.selectOption.emit(selectedOption)"
      [autoDisplayFirst]="autoDisplayFirst"
    >
      <ng-template pTemplate="selectedItem">
          <span
            *ngIf="icon"
            class="material-icons align-top pe-1 "
            aria-hidden="true"
            >{{ icon }}</span
          >
          <span class="dropdown-label">{{
            selectedOption?.label || '' | translate
          }}</span>
      </ng-template>

      <ng-template pTemplate="item" let-option>
        <div [class]="option.styleClasses || ''">
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
      .dropdown-label {
        font-family: 'Noto Sans', sans-serif;
        font-size: 1rem;
      }
    `,
  ],
})
export class DropdownComponent<T> implements OnInit {
  @Input() @Required id!: string;
  @Input() label?: string | null;
  @Input() options: DropdownOption<T>[] = [];
  @Input() display = 'inline-block';
  @Input() bg = 'white';
  @Input() styleClasses = '';
  @Input() icon?: string;
  @Input() autoDisplayFirst = false;

  @Output() selectOption = new EventEmitter<DropdownOption<T>>();

  selectedOption?: DropdownOption<T>;

  get placeholder(): DropdownOption<T> {
    return {
      label: this.label || '',
      value: null as T | null,
    };
  }

  ngOnInit() {
    if (!this.autoDisplayFirst) {
      this.selectedOption = this.placeholder;
      return;
    }

    this.selectedOption = this.options[0];
  }
}
