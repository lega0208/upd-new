import { Component, OnInit } from '@angular/core';

import localeEnCa from '@angular/common/locales/en-CA';
import localeFrCa from '@angular/common/locales/fr-CA';
import { registerLocaleData } from '@angular/common';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'Usability Performance Dashboard';
  
  ngOnInit(): void {

    registerLocaleData(localeEnCa, 'en-CA');
    registerLocaleData(localeFrCa, 'fr-CA');
  }
}
