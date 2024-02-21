import { Component, Input, AfterViewInit } from '@angular/core';

@Component({
  selector: 'upd-accordion',
  template: `
    <div ngbAccordion [class]="flash">
      <div ngbAccordionItem [collapsed]="!expanded">
        <h2 ngbAccordionHeader>
          <button ngbAccordionButton>{{ title | translate }}</button>
        </h2>

        <div ngbAccordionCollapse>
          <div ngbAccordionBody>
            <ng-template>
              <ng-content></ng-content>
            </ng-template>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./accordion.component.scss'],
})
export class AccordionComponent {
  @Input() title = 'view-data-table';
  @Input() styleClass = '';
  @Input() expanded = false;

  flash = '';

  flashAccordion() {
    this.flash = 'flash';

    setTimeout(() => {
      this.flash = '';
    }, 1000); // Duration should match the total animation time
  }
}
