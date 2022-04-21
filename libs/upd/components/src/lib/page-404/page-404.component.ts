import { Component, Input, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { I18nFacade } from '@cra-arc/upd/state';

@Component({
  selector: 'app-page-404',
  templateUrl: './page-404.component.html',
  styleUrls: ['./page-404.component.css'],
})
export class Page404Component implements OnInit {
  @Input() tabs: { href: string; title: string }[] = [];
  ngOnInit(): void {}
  constructor(private i18n:I18nFacade){}
}
