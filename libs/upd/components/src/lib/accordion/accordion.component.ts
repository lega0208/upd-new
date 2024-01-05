import { Component, Input, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'upd-accordion',
  templateUrl: './accordion.component.html',
  styleUrls: ['./accordion.component.scss'],
})
export class AccordionComponent {
  @Input() title = 'view-data-table';
  @Input() styleClass = '';
  @Input() expanded = false;
  @ViewChild('accordionElement', { static: false })
  accordionElement!: ElementRef;

  flashAccordion() {
    const element = this.accordionElement.nativeElement;
    this.accordionElement.nativeElement.addClass(element, 'flash');

    setTimeout(() => {
      this.accordionElement.nativeElement.removeClass(element, 'flash');
    }, 1000); // Duration should match the total animation time
  }
}
