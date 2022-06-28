import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AboutUsComponent } from './about-us.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([
      { path: '', pathMatch: 'full', component: AboutUsComponent }
    ]),
  ],
  declarations: [AboutUsComponent],
})
export class AboutUsModule {}
