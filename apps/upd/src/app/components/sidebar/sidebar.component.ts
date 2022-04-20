import { Component, OnInit } from '@angular/core';
import { I18nFacade } from '@cra-arc/upd/state';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit {
  logoVisible: boolean = false;
  constructor(private i18n: I18nFacade, private translateService: TranslateService) {}

  ngOnInit(): void {
    this.translateService.onLangChange.subscribe((event: any) =>
    {
      this.logoVisible = ! this.logoVisible;
    });
  }
}
