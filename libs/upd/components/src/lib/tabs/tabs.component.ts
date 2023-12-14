import { Component, Input, TemplateRef } from '@angular/core';

export interface Tab {
  title: string;
  icon?: string;
  contentTemplate: TemplateRef<any>;
}

@Component({
  selector: 'upd-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss'],
})
export class TabsComponent {
  @Input() tabs: Tab[] = [];
}
