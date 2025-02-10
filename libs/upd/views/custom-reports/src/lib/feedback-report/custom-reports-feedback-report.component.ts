import { Component, computed, inject, Signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '@dua-upd/upd/services';
import { toSignal } from '@angular/core/rxjs-interop';
import { ColumnConfig, IFeedback } from '@dua-upd/types-common';
import { Types } from 'mongoose';
import { I18nFacade } from '@dua-upd/upd/state';
import { UpdComponentsModule } from '@dua-upd/upd-components';
import { I18nModule } from '@dua-upd/upd/i18n';

type CommentsData = IFeedback & {
  pageTitle: { _id: string; title: string };
  taskTitles: [string];
  projectTitles: [string];
  selectedPages: { _id: string; title: string }[];
  selectedTasks: { _id: string; title: string; pages: string[] }[];
  selectedProjects: { _id: string; title: string; pages: string[] }[];
};

@Component({
  selector: 'dua-upd-custom-reports-feedback-report',
  standalone: true,
  imports: [CommonModule, I18nModule, UpdComponentsModule],
  templateUrl: './custom-reports-feedback-report.component.html',
  styleUrl: './custom-reports-feedback-report.component.scss',
  providers: [ApiService, I18nFacade],
})
export class CustomReportsFeedbackReportComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private readonly api = inject(ApiService);
  private i18n = inject(I18nFacade);

  queryParams = toSignal(this.route.queryParamMap);

  startDate = computed(() => this.queryParams()?.get('start') || '');

  endDate = computed(() => this.queryParams()?.get('end') || '');

  pages = computed(() => {
    const param = this.queryParams()?.get('pages') || '';

    if (param) {
      const pages = param.split('-');
      return pages.map((page) => new Types.ObjectId(page));
    }

    return [];
  });

  tasks = computed(() => {
    const param = this.queryParams()?.get('tasks') || '';

    if (param) {
      const tasks = param.split('-');
      return tasks.map((task) => new Types.ObjectId(task));
    }

    return [];
  });

  projects = computed(() => {
    const param = this.queryParams()?.get('projects') || '';

    if (param) {
      const projects = param.split('-');
      return projects.map((project) => new Types.ObjectId(project));
    }

    return [];
  });

  comments: Signal<{ comments: CommentsData[] } | null> = toSignal(
    this.api.queryDb({
      comments: {
        collection: 'feedback',
        filter: {
          date: {
            $gte: new Date(this.startDate()),
            $lte: new Date(this.endDate()),
          },
          page: this.pages(),
          tasks: this.tasks(),
          projects: this.projects(),
        },
      },
    }),
    {
      initialValue: null,
    },
  );

  commentsData = computed(() => {
    const comments =
      this.comments()?.comments.map((c) => ({
        date: c.date,
        url: c.url,
        comment: c.comment,
        taskTitles: c.taskTitles.join(', '),
        projectTitles: c.projectTitles.join(', '),
      })) || [];
    return comments.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  });

  selectedPages = computed(() => this.comments()?.comments[0].selectedPages);

  selectedTasks = computed(() => this.comments()?.comments[0].selectedTasks);

  selectedProjects = computed(
    () => this.comments()?.comments[0].selectedProjects,
  );

  selectedPagesAmount = computed(() => this.selectedPages()?.length || 0);

  selectedTasksAmount = computed(() => this.selectedTasks()?.length || 0);

  selectedProjectsAmount = computed(() => this.selectedProjects()?.length || 0);

  selectedAmount = computed(
    () =>
      this.selectedPagesAmount() +
      this.selectedTasksAmount() +
      this.selectedProjectsAmount(),
  );

  columnsComments: ColumnConfig<{
    date: Date;
    url: string;
    comment: string;
    taskTitles: string;
    projectTitles: string;
  }>[] = [
    {
      field: 'date',
      header: 'date',
      pipe: 'date',
      translate: true,
    },
    {
      field: 'url',
      header: 'url',
    },
    {
      field: 'comment',
      header: 'comment',
    },
    {
      field: 'taskTitles',
      header: 'tasks',
      translate: true,
    },
    {
      field: 'projectTitles',
      header: 'ux-projects',
      translate: true,
    },
  ];

  goBack() {
    this.router.navigate(['../create'], {
      relativeTo: this.route,
    });
  }

  ngOnInit() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
