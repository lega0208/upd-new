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
    @if (selectedOption && options.length > 0) {
      <p-dropdown
        [options]="options"
        [placeholder]="label || ''"
        optionLabel="label"
        [(ngModel)]="selectedOption"
        (onChange)="this.selectOption.emit(selectedOption)"
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
    }
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
  @Input() label?: string;
  @Input() options: DropdownOption<T>[] = [];
  @Input() display = 'inline-block';
  @Input() bg = 'white';
  @Input() styleClasses = '';
  @Input() icon?: string;
  @Input() autoDisplayFirst = false;
  @Input() set initialSelection(
    option: DropdownOption<T> | DropdownOption<T>['value'] | undefined,
  ) {
    if (!option) {
      return;
    }

    if (typeof option === 'object' && 'label' in option && 'value' in option) {
      this.selectedOption = option;
      return;
    }

    this.selectedOption = this.options.find((o) => o.value === option);
  }

  @Output() selectOption = new EventEmitter<DropdownOption<T>>();

  selectedOption?: DropdownOption<T>;

  ngOnInit() {
    if (this.selectedOption !== undefined) {
      return;
    }

    if (this.autoDisplayFirst) {
      this.selectedOption = this.options[0];
    }
  }
}
