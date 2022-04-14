import { Component } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEnCa from '@angular/common/locales/en-CA';
import localeFrCa from '@angular/common/locales/fr-CA';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent{
  title = 'Usability Performance Dashboard'; // todo: add translation for title
}
