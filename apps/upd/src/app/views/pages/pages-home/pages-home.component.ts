import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api/api.service';
import { PageDocument } from '@cra-arc/db';

@Component({
  selector: 'app-pages-home',
  templateUrl: './pages-home.component.html',
  styleUrls: ['./pages-home.component.css'],
})
export class PagesHomeComponent implements OnInit {
  data: PageDocument[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getAllPages().subscribe((data: PageDocument[]) => {
      this.data.push(...data);
    });
  }
}
