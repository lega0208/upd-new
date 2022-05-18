import { Component, Input } from '@angular/core';

@Component({
  selector: 'upd-nav-tabs',
  templateUrl: './nav-tabs.component.html',
  styleUrls: ['./nav-tabs.component.css'],
})
export class NavTabsComponent {
  @Input() tabs: { href: string; title: string }[] = [];
}
