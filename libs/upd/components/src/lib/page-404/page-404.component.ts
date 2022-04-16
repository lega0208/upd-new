import { Component, Input, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';

@Component({
  selector: 'app-page-404',
  templateUrl: './page-404.component.html',
  styleUrls: ['./page-404.component.css'],
})
export class Page404Component implements OnInit {
  @Input() tabs: { href: string; title: string }[] = [];
  ngOnInit(): void {}
}
