import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CustomReportsComponent } from './custom-reports.component';
import { CustomReportsCreateComponent } from './create/custom-reports-create.component';
import { CustomReportsReportComponent } from './report/custom-reports-report.component';

@NgModule({
  imports: [
    CustomReportsComponent,
    CustomReportsCreateComponent,
    RouterModule.forChild([
      {
        path: '',
        component: CustomReportsComponent,
        children: [
          { path: '', redirectTo: 'create', pathMatch: 'full' },
          {
            path: 'create',
            component: CustomReportsCreateComponent,
            data: { title: 'UPD | Custom reports | Create' },
          },
          {
            path: ':id',
            component: CustomReportsReportComponent,
            data: { title: 'UPD | Custom reports | Report' },
          },
        ],
      },
    ]),
  ],
  exports: [RouterModule],
})
export class CustomReportsModule {}
