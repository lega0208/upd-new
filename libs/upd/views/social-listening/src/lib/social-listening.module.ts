import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SocialListeningDashboardComponent } from './dashboard/social-listening-dashboard.component';

@NgModule({
  imports: [
    SocialListeningDashboardComponent,
    RouterModule.forChild([
      {
        path: '',
        component: SocialListeningDashboardComponent,
        data: { title: 'Social Listening | Dashboard' },
      },
    ]),
  ],
  exports: [RouterModule],
})
export class SocialListeningModule {}