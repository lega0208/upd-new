import { CommonModule } from '@angular/common';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { Router } from '@angular/router';
import {
  Component,
  ElementRef,
  NgZone,
  ViewChild,
  ViewEncapsulation,
  WritableSignal,
  inject,
  signal,
  Signal,
  computed,
  effect,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { I18nFacade } from '@dua-upd/upd/state';
import { ApiService } from '@dua-upd/upd/services';
import type { LocaleId } from '@dua-upd/upd/i18n';
import {
  type ColumnConfig,
  DataTableComponent,
  AccordionComponent,
  CalendarComponent,
  UpdComponentsModule,
  type DropdownOption,
} from '@dua-upd/upd-components';
import type {
  AADimensionName,
  AAMetricName,
  AAQueryDateStart,
  AAQueryDateEnd,
  ReportCreateResponse,
  ReportConfig,
  ReportDimension,
  ReportGranularity,
  ReportMetric,
} from '@dua-upd/types-common';

dayjs.extend(utc);

type PageSelectionData = {
  pages: { _id: string; url: string; title: string }[];
  tasks: { title: string; pages: string[] }[];
  projects: { title: string; pages: string[] }[];
};

@Component({
  selector: 'dua-upd-custom-reports-create',
  standalone: true,
  imports: [
    CommonModule,
    UpdComponentsModule,
    TranslateModule,
    ClipboardModule,
  ],
  templateUrl: './custom-reports-create.component.html',
  styleUrls: ['./custom-reports-create.component.scss'],
  providers: [ApiService],
  encapsulation: ViewEncapsulation.None,
})
export class CustomReportsCreateComponent {
  private router = inject(Router);
  private zone: NgZone = inject(NgZone);
  private i18n = inject(I18nFacade);
  private readonly api = inject(ApiService);

  // get required data from the api
  selectionData: Signal<PageSelectionData | null> = toSignal(
    this.api.queryDb({
      pages: {
        collection: 'pages',
        filter: {},
        project: { url: 1, title: 1 },
      },
      tasks: {
        collection: 'tasks',
        filter: { pages: { $exists: true, $size: { $not: 0 } } },
        project: { title: 1, pages: 1 },
      },
      projects: {
        collection: 'projects',
        filter: { pages: { $exists: true, $size: { $not: 0 } } },
        project: { title: 1, pages: 1 },
      },
    }),
    {
      initialValue: null,
    },
  );

  pages = computed(() => this.selectionData()?.pages || []);
  tasks = computed(() => this.selectionData()?.tasks || []);
  projects = computed(() => this.selectionData()?.projects || []);

  pagesMap = computed(
    () => new Map(this.pages().map((page) => [page._id, page])),
  );

  validationTriggered = false;

  error: WritableSignal<string | null> = signal(null);

  lang: Signal<LocaleId> = toSignal(this.i18n.currentLang$, {
    initialValue: this.i18n.service.currentLang,
  });

  dateRange = signal({
    start: '',
    end: '',
  });

  selectedReportMetrics = signal<AAMetricName[]>([]);

  selectedReportDimensions = signal<string>('');

  isGrouped = signal(false);

  readonly granularityOptions: DropdownOption<ReportGranularity>[] = [
    { label: 'Daily', value: 'day' },
    { label: 'Weekly', value: 'week' },
    { label: 'Monthly', value: 'month' },
  ];

  selectedGranularity = signal(this.granularityOptions[0].value);

  granularityLabel = computed(() => {
    return this.granularityOptions.find(
      (option) => option.label === this.selectedGranularity(),
    )?.label;
  });

  reportUrls = signal<string[]>([]);

  config = computed<ReportConfig>(() => ({
    dateRange: this.dateRange(),
    granularity: this.selectedGranularity(),
    urls: this.reportUrls(),
    grouped: this.isGrouped(),
    metrics: this.selectedReportMetrics(),
    breakdownDimension: this.selectedReportDimensions() as AADimensionName,
  }));

  @ViewChild('dataTable') dataTableComponent!: DataTableComponent<
    PageSelectionData['pages']
  >;
  @ViewChild('tasksTable') tasksTableComponent!: DataTableComponent<
    PageSelectionData['tasks']
  >;
  @ViewChild('projectsTable') projectsTableComponent!: DataTableComponent<
    PageSelectionData['projects']
  >;
  @ViewChild('urlTextarea') urlTextarea!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('urlsAdded') accordionComponent!: AccordionComponent;
  @ViewChild('calendar') calendarComponent!: CalendarComponent;

  columns: Signal<ColumnConfig<PageSelectionData['pages']>[]> = computed(() => [
    {
      field: 'title',
      header: this.i18n.service.translate('Title', this.lang()),
    },
    {
      field: 'url',
      header: this.i18n.service.translate('URL', this.lang()),
    },
  ]);

  taskColumns: Signal<ColumnConfig<PageSelectionData['tasks']>[]> = computed(
    () => [
      {
        field: 'title',
        header: this.i18n.service.translate('Title', this.lang()),
      },
    ],
  );

  searchFields = computed(() => this.columns().map((col) => col.field));

  validUrls = computed<string[]>(() => this.pages()?.map((p) => p.url) || []);

  invalidUrls = signal<string[]>([]);
  newUrls = signal<string[]>([]);

  selectedPages = signal<PageSelectionData['pages']>([]);
  selectedTasks = signal<PageSelectionData['tasks']>([]);
  selectedProjects = signal<PageSelectionData['projects']>([]);

  combinedSelectedUrls = computed(() => {
    const selectedPageUrls = this.selectedPages().map((page) => page.url);

    const selectedTaskIds = this.selectedTasks().flatMap((task) => task.pages);

    const selectedProjectIds = this.selectedProjects().flatMap(
      (project) => project.pages,
    );

    const pageIds = new Set(selectedTaskIds.concat(selectedProjectIds));

    const combinedUrls = new Set(selectedPageUrls);

    const pagesMap = this.pagesMap();

    const reportUrls = this.reportUrls();

    for (const id of pageIds) {
      const page = pagesMap.get(id);

      if (!page) {
        // should probably change this to throw an error, seeing as these ids *should* always be valid
        console.error(`Page with id ${id} not found`);
        continue;
      }

      // pre-filter urls that are already included
      if (reportUrls.includes(page.url)) continue;

      combinedUrls.add(page.url);
    }

    return combinedUrls;
  });

  showCopyAlert = false;

  reportMetrics: ReportMetric[] = [
    {
      label: 'Visits',
      id: 'visits',
      description: 'The total number of visits to your site.',
    },
    {
      label: 'Page views',
      id: 'views',
      description: 'The total number of pageviews for your site.',
    },
    {
      label: 'Visitors',
      id: 'visitors',
      description: 'The total number of visitors to your site.',
    },
  ];

  reportDimensions: ReportDimension[] = [
    { label: 'None', id: '', description: '' },
    { label: 'Devices', id: 'device_type', description: '' },
    { label: 'Regions', id: 'region', description: '' },
    { label: 'Cities', id: 'city', description: '' },
    { label: 'Countries', id: 'country', description: '' },
  ];

  constructor() {
    effect(() => {
      this.selectedGranularity(); // don't need the value, just need to trigger the effect on change
      this.resetCalendar();
    });
  }

  copyToClipboard() {
    this.showCopyAlert = !this.showCopyAlert;
  }

  addPages(inputValue: string) {
    const reportUrls = this.reportUrls();

    const parsedUrls = inputValue
      .split(/[\n,;]+/)
      .map((url) => url.trim().replace(/^https?:\/\//, ''))
      .filter((url) => !reportUrls.includes(url) && url.length > 0);

    const validNewUrls = new Set<string>();
    const invalidUrls: string[] = [];

    const validUrls = this.validUrls();

    for (const url of [...parsedUrls, ...this.combinedSelectedUrls()]) {
      if (validUrls.includes(url)) {
        validNewUrls.add(url);
        continue;
      }

      invalidUrls.push(url);
    }

    this.invalidUrls.set(invalidUrls);
    this.newUrls.set(Array.from(validNewUrls));
    this.reportUrls.mutate((urls) => urls.push(...validNewUrls));
  }

  removePage(index: number) {
    this.reportUrls.mutate((urls) => urls.splice(index, 1));
  }

  resetUrls() {
    this.reportUrls.set([]);
  }

  resetCalendar(): void {
    this.calendarComponent?.resetCalendar();
  }

  resetTableSelection() {
    this.dataTableComponent.clearSelections();
    this.tasksTableComponent.clearSelections();
    this.projectsTableComponent.clearSelections();
    this.urlTextarea.nativeElement.value = '';
  }

  handleDateChange(date: Date | Date[]) {
    if (!Array.isArray(date)) {
      this.dateRange.set({
        start: '',
        end: '',
      });

      return;
    }

    const [startDate, endDate] = date;

    // make sure the timezone offset is correct
    this.dateRange.set({
      start: dayjs(startDate)
        .utc()
        .format('YYYY-MM-DDT00:00:00.000') as AAQueryDateStart,
      end: dayjs(endDate || startDate)
        .utc()
        .format('YYYY-MM-DDT23:59:59.999') as AAQueryDateEnd,
    });
  }

  selectPages(pages: PageSelectionData['pages']) {
    this.selectedPages.set(pages);
  }

  selectTasks(tasks: PageSelectionData['tasks']) {
    this.selectedTasks.set(tasks);
  }

  selectProjects(tasks: PageSelectionData['projects']) {
    this.selectedProjects.set(tasks);
  }

  selectDimension(dimension: string) {
    this.selectedReportDimensions.set(dimension);
  }

  selectGranularity(granularity: string) {
    this.selectedGranularity.set(granularity as ReportGranularity);
  }

  selectMetrics(metrics: AAMetricName[]) {
    this.selectedReportMetrics.set(metrics);
  }

  setIsGrouped(isGrouped: boolean) {
    this.isGrouped.set(isGrouped);
  }

  get isAccordionExpanded(): boolean {
    return this.reportUrls().length < 10;
  }

  // is it even an option to have granularity of 'none'?
  // also the logic in the template is confusing me
  isGranularitySelected(): boolean {
    return this.config().granularity && this.config().granularity !== 'none';
  }

  openLink(event: MouseEvent, link: string) {
    if (event.ctrlKey) {
      window.open(link, '_blank');
    } else {
      event.preventDefault();
    }
  }

  isDateRangeValid(): boolean {
    const config = this.config();
    return !!config.dateRange.start && !!config.dateRange.end;
  }

  areUrlsValid(): boolean {
    const config = this.config();
    return config.urls && config.urls.length > 0;
  }

  areMetricsValid(): boolean {
    const config = this.config();
    return config.metrics && config.metrics.length > 0;
  }

  resetValidation() {
    if (this.validationTriggered) {
      this.validationTriggered = false;
    }
  }

  get displayConfig() {
    return JSON.stringify(this.config(), null, 2);
  }

  async createReport(config: ReportConfig) {
    if (
      this.isDateRangeValid() &&
      this.areUrlsValid() &&
      this.areMetricsValid()
    ) {
      console.log('Report Configuration:', config);
      const res: ReportCreateResponse = await fetch(
        '/api/custom-reports/create',
        {
          method: 'POST',
          body: JSON.stringify(config),
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ).then((res) => res.json());

      if ('error' in res) {
        this.error.set(res.error);

        return;
      }

      await this.zone.run(() =>
        this.router.navigateByUrl(
          `/${this.lang().slice(0, 2)}/custom-reports/${res._id}`,
        ),
      );
    } else {
      this.validationTriggered = true;
    }
  }
}
