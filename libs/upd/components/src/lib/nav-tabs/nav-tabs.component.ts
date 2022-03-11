import { Component, Input, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';

@Component({
  selector: 'app-nav-tabs',
  templateUrl: './nav-tabs.component.html',
  styleUrls: ['./nav-tabs.component.css'],
})
export class NavTabsComponent implements OnInit {

    @Input() tabs: Array<{ href: string, title: string}>  = [];
  ngOnInit(): void {}
}
