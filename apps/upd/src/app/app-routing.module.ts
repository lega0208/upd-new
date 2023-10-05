import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'overview',
    pathMatch: 'full',
  },
  {
    path: 'overview',
    loadChildren: () =>
      import('@dua-upd/upd/views/overview').then(
        (module) => module.OverviewModule
      ),
    data: { animation: 'overview', title: 'Overview | Summary' },
  },
  {
    path: 'pages',
    loadChildren: () =>
      import('@dua-upd/upd/views/pages').then((module) => module.PagesModule),
    data: { animation: 'pages', title: 'Pages | Home' },
  },
  {
    path: 'tasks',
    loadChildren: () =>
      import('@dua-upd/upd/views/tasks').then((module) => module.TasksModule),
    data: { animation: 'tasks', title: 'Tasks | Home' },
  },
  {
    path: 'projects',
    loadChildren: () =>
      import('@dua-upd/upd/views/projects').then(
        (module) => module.ProjectsModule
      ),
    data: { animation: 'projects', title: 'Projects | Home' },
  },
  {
    path: 'about-us',
    loadChildren: () =>
      import('@dua-upd/upd/views/about-us').then(
        (module) => module.AboutUsModule
      ),
  },
  {
    path: 'reports',
    loadChildren: () =>
      import('@dua-upd/upd/views/reports').then(
        (module) => module.ReportsModule
      ),
  },
  { path: '**', redirectTo: 'overview' },
];

@NgModule({
  imports: [
    RouterModule.forRoot([
      {
        path: ':lang',
        children: routes,
      },
    ]),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
