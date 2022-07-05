import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AboutUsComponent } from './about-us.component';
import { I18nModule } from '@dua-upd/upd/i18n';
import { I18nFacade } from '@dua-upd/upd/state';

@NgModule({
  imports: [
    I18nModule,
    CommonModule,
    RouterModule.forChild([
      { path: '', pathMatch: 'full', component: AboutUsComponent }
    ]),
  ],
  declarations: [AboutUsComponent],
})
export class AboutUsModule {}
