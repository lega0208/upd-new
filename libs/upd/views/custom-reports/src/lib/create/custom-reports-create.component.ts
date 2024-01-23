import { CommonModule } from '@angular/common';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { ActivatedRoute, Router } from '@angular/router';
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
import { I18nFacade } from '@dua-upd/upd/state';
import { today } from '@dua-upd/utils-common';
import { TranslateModule } from '@ngx-translate/core';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { ApiService } from '@dua-upd/upd/services';
import { I18nModule } from '@dua-upd/upd/i18n';
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
  ReportGranularity,
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
    I18nModule,
  ],
  templateUrl: './custom-reports-create.component.html',
  styleUrls: ['./custom-reports-create.component.scss'],
  providers: [ApiService, I18nFacade],
  encapsulation: ViewEncapsulation.None,
})
export class CustomReportsCreateComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private zone: NgZone = inject(NgZone);
  private i18n = inject(I18nFacade);
  private readonly api = inject(ApiService);

  lang = this.i18n.currentLang;

  storageConfig: ReportConfig | null =
    history.state['config'] ||
    JSON.parse(sessionStorage.getItem('custom-reports-config') || 'null');

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
        filter: { pages: { $exists: true, $not: { $size: 0 } } },
        project: { title: 1, pages: 1 },
      },
      projects: {
        collection: 'projects',
        filter: { pages: { $exists: true, $not: { $size: 0 } } },
        project: { title: 1, pages: 1 },
      },
    }),
    {
      initialValue: null,
    },
  );

  pages = computed(() => this.selectionData()?.pages || []);
  tasks = computed(
    () =>
      this.selectionData()?.tasks.map((task) => {
        return {
          ...task,
          title: this.i18n.service.translate(task.title, this.lang()),
        };
      }) || [],
  );
  projects = computed(
    () =>
      this.selectionData()?.projects.map((project) => {
        return {
          ...project,
          title: this.i18n.service.translate(project.title, this.lang()),
        };
      }) || [],

  );
  pagesMap = computed(
    () => new Map(this.pages().map((page) => [page._id, page])),
  );

  validationTriggered = false;

  error: WritableSignal<string | null> = signal(null);

  calendarDateFormat = computed(() =>
    this.lang() === 'en-CA' ? 'M dd yy' : 'dd M yy',
  );

  dateRange = signal({
    start: this.storageConfig?.dateRange.start || '',
    end: this.storageConfig?.dateRange.end || '',
  });

  selectedReportMetrics = signal<AAMetricName[]>(
    this.storageConfig?.metrics || [],
  );

  selectedReportDimensions = signal<string>(
    this.storageConfig?.breakdownDimension || '',
  );

  isGrouped = signal(this.storageConfig?.grouped || false);

  readonly granularityOptions: DropdownOption<ReportGranularity>[] = [
    { label: 'None', value: 'none' },
    { label: 'Daily', value: 'day' },
    { label: 'Weekly', value: 'week' },
    { label: 'Monthly', value: 'month' },
  ];

  selectedGranularity = signal<ReportGranularity>(
    this.storageConfig?.granularity || 'day',
  );

  reportUrls = signal<string[]>(this.storageConfig?.urls || []);

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

  titleCol = this.i18n.service.translationSignal('Title', (title) => ({
    field: 'title',
    header: title(),
  }));

  urlCol = this.i18n.service.translationSignal('URL', (url) => ({
    field: 'url',
    header: url(),
  }));

  columns: Signal<ColumnConfig<PageSelectionData['pages']>[]> = computed(() => [
    this.titleCol(),
    this.urlCol(),
  ]);

  taskColumns: Signal<ColumnConfig<PageSelectionData['tasks']>[]> = computed(
    () => [this.titleCol()],
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

  reportMetrics = [
    {
      label: 'Visits',
      value: 'visits',
      description: 'The total number of visits on the page',
    },
    {
      label: 'Page views',
      value: 'views',
      description: 'The total number of pageviews on the page',
    },
    {
      label: 'Visitors',
      value: 'visitors',
      description: 'The total number of visitors on the page',
    },
    {
      label: 'Average time spent',
      value: 'average_time_spent',
      description: 'The average time spent on the page',
    },
    {
      label: 'Bounce rate',
      value: 'bouncerate',
      description: 'The bounce rate on the page',
    },
    {
      label: 'Navigation menu initiated',
      value: 'nav_menu_initiated',
      description: 'The number of times the navigation menu was opened',
    },
    {
      label: '"Did you find what you were looking for?" - Submit',
      value: 'dyf_submit',
      description: 'The number of times the submit button was clicked',
    },
    {
      label: '"Did you find what you were looking for?" - Yes',
      value: 'dyf_yes',
      description: 'The number of times the "yes" button was clicked',
    },
    {
      label: '"Did you find what you were looking for?" - No',
      value: 'dyf_no',
      description: 'The number of times the "no" button was clicked',
    },
  ];

  reportDimensions = [
    { label: 'None', value: '', description: '' },
    { label: 'Devices', value: 'device_type', description: '' },
    { label: 'Regions', value: 'region', description: '' },
    { label: 'Cities', value: 'city', description: '' },
    { label: 'Countries', value: 'country', description: '' },
    { label: 'Referrer', value: 'referrer', description: '' },
    { label: 'Referrer type', value: 'referrer_type', description: '' },
    { label: 'Previous page', value: 'prev_page', description: '' },
    { label: 'Time spent', value: 'time_spent', description: '' },
  ];

  constructor() {
    effect(
      () => {
        this.selectedGranularity(); // don't need the value, just need to trigger the effect on change
        this.resetCalendar();
      },
      { allowSignalWrites: true },
    );

    effect(() => {
      sessionStorage.setItem(
        'custom-reports-config',
        JSON.stringify(this.config()),
      );
    });
  }

  stateDimension = this.reportDimensions.find(
    (d) => d.value === this.storageConfig?.breakdownDimension,
  );
  stateMetrics: string[] = this.storageConfig?.metrics || [];
  stateCalendarDates: Date[] = this.storageConfig?.dateRange
    ? dateRangeToCalendarDates(this.storageConfig.dateRange)
    : [];
  selectedGranularityOption = this.granularityOptions.find(
    (option) => option.value === this.storageConfig?.granularity,
  );

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
      if (validUrls.includes(url) && !reportUrls.includes(url)) {
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

    if (date.length !== 0) {
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
    console.log(dimension);
    this.selectedReportDimensions.set(dimension);
  }

  selectGranularity(granularity: 'day' | 'week' | 'month' | 'none' | null) {
    this.selectedGranularity.set(granularity as ReportGranularity);
  }

  selectMetrics(metrics: string[]) {
    // not typesafe: ensure the values passed to checkboxes are valid
    this.selectedReportMetrics.set(metrics as AAMetricName[]);
  }

  setIsGrouped(isGrouped: boolean) {
    this.isGrouped.set(isGrouped);
  }

  get isAccordionExpanded(): boolean {
    return this.reportUrls().length < 10;
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

    const startDate = dayjs.utc(config.dateRange.start);
    const endDate = dayjs.utc(config.dateRange.end);

    return (
      !!config.dateRange.start &&
      !!config.dateRange.end &&
      startDate.isBefore(today()) &&
      endDate.isAfter(startDate)
    );
  }

  areUrlsValid(): boolean {
    return this.config().urls?.length > 0;
  }

  areMetricsValid(): boolean {
    return this.config().metrics?.length > 0;
  }

  resetValidation() {
    if (this.validationTriggered) {
      this.validationTriggered = false;
    }
  }

  async createReport(config: ReportConfig) {
    if (
      !this.isDateRangeValid() ||
      !this.areUrlsValid() ||
      !this.areMetricsValid()
    ) {
      this.validationTriggered = true;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

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
      this.router.navigate(['../', res._id], { relativeTo: this.route }),
    );
  }
}

function dateRangeToCalendarDates(
  dateRange: ReportConfig['dateRange'],
): Date[] {
  const dates: Date[] = [];

  if (dateRange.start) {
    dates.push(new Date(dateRange.start));
  }

  if (dateRange.end) {
    dates.push(new Date(dateRange.end));
  }

  return dates;
}
