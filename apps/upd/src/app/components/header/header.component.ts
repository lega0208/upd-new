import { Component, OnInit } from '@angular/core';

import dayjs from 'dayjs';
import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
  // todo: lang toggling & routing
  constructor(private translateService: TranslateService) {}

  public selectLanguage(event:any){
    this.translateService.use(event.target.value)
    const currentLanguage = this.translateService.currentLang;
    //dayjs.locale(currentLanguage);
    //console.log(currentLanguage)
  }


  ngOnInit(): void {}
}
