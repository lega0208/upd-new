import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from './api.service';

@NgModule({
  imports: [CommonModule],
  providers: [ApiService],
})
export class ServicesModule {}
