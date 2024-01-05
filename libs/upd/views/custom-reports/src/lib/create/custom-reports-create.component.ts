import {
  Component,
  ElementRef,
  NgZone,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  WritableSignal,
  inject,
  signal,
} from '@angular/core';
import { combineLatest, map } from 'rxjs';
import {
  ColumnConfig,
  DataTableComponent,
  AccordionComponent,
  CalendarComponent,
  UpdComponentsModule,
} from '@dua-upd/upd-components';
import { I18nFacade } from '@dua-upd/upd/state';
import { AADimensionName, AAMetricName, PagesHomeAggregatedData, ReportCreateResponse } from '@dua-upd/types-common';
import dayjs from 'dayjs';
import { CustomReportStore } from '../+state/custom-reports.store';

import {
  ReportDimension,
  ReportMetric,
  ReportGranularity,
  ReportConfig,
  AAQueryDateStart,
  AAQueryDateEnd,
} from '@dua-upd/types-common';

import utc from 'dayjs/plugin/utc';
import { LocaleId } from '@dua-upd/upd/i18n';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ClipboardModule } from '@angular/cdk/clipboard';
dayjs.extend(utc);

// @@@ basically just go through everything and start committing?
@Component({
  selector: 'dua-upd-custom-reports-create',
  standalone: true,
  imports: [CommonModule, UpdComponentsModule, TranslateModule, ClipboardModule],
  templateUrl: './custom-reports-create.component.html',
  styleUrls: ['./custom-reports-create.component.scss'],
  providers: [CustomReportStore],
  encapsulation: ViewEncapsulation.None,
})
export class CustomReportsCreateComponent {
  private router = inject(Router);
  private zone: NgZone = inject(NgZone);
  private i18n = inject(I18nFacade);
  // private readonly pagesHomeService = inject(PagesHomeFacade);
  // pagesHomeData$ = this.pagesHomeService.pagesHomeTableData$;
  // loading$ = this.pagesHomeService.loading$;

  // projects$ = this.pagesHomeService.projects$;
  // tasks$ = this.pagesHomeService.tasks$;

  private readonly customReportStore = inject(CustomReportStore);
  data = this.customReportStore.loadReportData();
  loading$ = this.customReportStore.loading$;

  projects$ = this.customReportStore.projects$;
  tasks$ = this.customReportStore.tasks$;
  pages$ = this.customReportStore.pages$;

  validationTriggered = false;
  error: WritableSignal<string | null> = signal(null);
  currentLang$ = this.i18n.currentLang$;

  lang = signal<LocaleId>(this.i18n.service.currentLang);

  allMetricsSelected = false;
  isMetricsIndeterminate = false;
  config = signal<ReportConfig>({
    dateRange: {
      start: '',
      end: '',
    },
    granularity: '' as ReportGranularity,
    urls: [],
    grouped: false,
    metrics: [],
  });

  dateRange = {
    start: '' as string,
    end: '' as string,
  };

  @ViewChild('dataTable') dataTableComponent!: DataTableComponent<any>;
  @ViewChild('tasksTable') tasksTableComponent!: DataTableComponent<any>;
  @ViewChild('projectsTable') projectsTableComponent!: DataTableComponent<any>;
  @ViewChild('urlTextarea') urlTextarea!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('urlsAdded') accordionComponent!: AccordionComponent;
  @ViewChild('calendar') calendarComponent!: CalendarComponent;

  columns: ColumnConfig<PagesHomeAggregatedData>[] = [];
  taskColumns: ColumnConfig<any>[] = [];

  searchFields = this.columns.map((col) => col.field);

  validUrls: string[] = [];
  validatedUrls: string[] = [];
  invalidUrls: string[] = [];
  duplicateUrls: string[] = [];
  successUrls: string[] = [];

  selectedPages: any[] = [];
  selectedTasks: any[] = [];
  selectedProjects: any[] = [];
  selectedReportMetrics: AAMetricName[] = [];
  selectedReportDimensions = '';

  urls: string[] = [];
  showCopyAlert = false;

  dimensionLabel = 'None';
  breakdownLabel = 'Select';
  granularityLabel = 'Daily';
  granularityValue = 'day';
  isGrouped = false;

  granularityOptions = [
    { label: 'Daily', value: 'day' },
    { label: 'Weekly', value: 'week' },
    { label: 'Monthly', value: 'month' }
  ];

  dimensionOptions!: { label: string; value: string }[];

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

  copyToClipboard() {
    this.showCopyAlert = !this.showCopyAlert;
  }

  addPages(inputValue: string) {
    this.invalidUrls = [];
    this.duplicateUrls = [];
    this.successUrls = [];

    const previousUrls = new Set(this.urls);

    const parsedUrls = inputValue
      .split(/[\n,;]+/)
      .map((url) => url.trim().replace(/^https?:\/\//, ''))
      .filter((url) => url.length > 0);

    const selectedPageUrls = this.selectedPages.map((page) => page.url);
    const selectedTaskUrls = this.selectedTasks.map((task) => task.urls).flat();
    const selectedProjectUrls = this.selectedProjects
      .map((project) => project.urls)
      .flat();

    const allSelectedUrls = [
      ...selectedPageUrls,
      ...selectedTaskUrls,
      ...selectedProjectUrls,
    ];

    const newUrls = allSelectedUrls.filter(url => !previousUrls.has(url));

    for (const url of parsedUrls) {
      if (this.validUrls.includes(url)) {
        if (allSelectedUrls.includes(url) || this.urls.includes(url)) {
          this.duplicateUrls.push(url);
        } else {
          this.urls.push(url);
          this.successUrls.push(url);
        }
      } else {
        this.invalidUrls.push(url);
      }
    }

    this.urls = Array.from(new Set([...allSelectedUrls, ...this.urls]));
    this.duplicateUrls = Array.from(new Set(this.duplicateUrls));
    this.invalidUrls = Array.from(new Set(this.invalidUrls));
    this.successUrls = Array.from(new Set([...newUrls, ...this.successUrls]));

    this.config.update((f) => {
      return {
        ...f,
        urls: this.urls,
      };
    });

    console.log(this.successUrls)
  }

  removePage(index: number) {
    this.urls.splice(index, 1);
  }

  resetUrls() {
    this.urls = [];
    this.selectedPages = [];
    this.config.update((f) => {
      return {
        ...f,
        urls: this.urls,
      };
    });
  }

  resetCalendar(): void {
    if (this.calendarComponent) {
      this.calendarComponent.resetCalendar();
    }
  }

  ngOnInit() {
    combineLatest([this.pages$, this.currentLang$]).subscribe(
      ([data, lang]) => {
        this.columns = [
          {
            field: 'title',
            header: this.i18n.service.translate('Title', lang),
          },
          {
            field: 'url',
            header: this.i18n.service.translate('URL', lang),
          },
        ];
      },
    );

    combineLatest([this.tasks$, this.currentLang$]).subscribe(
      ([data, lang]) => {
        this.taskColumns = [
          {
            field: 'title',
            header: this.i18n.service.translate('Title', lang),
          },
        ];
      },
    );

    this.pages$.subscribe((data) => {
      this.validUrls = data.map((page) => page.url);
    });
    this.searchFields = this.columns.map((col) => col.field);

    this.dimensionOptions = this.transformDimensionOptions(
      this.reportDimensions,
    );
  }

  handleSelectedPages(pages: any[]) {
    this.selectedPages = pages;
  }

  handleSelectedTasks(tasks: any[]) {
    this.selectedTasks = tasks;
  }

  handleSelectedProjects(projects: any[]) {
    this.selectedProjects = projects;
  }

  resetTableSelection() {
    this.dataTableComponent.clearSelections();
    this.tasksTableComponent.clearSelections();
    this.projectsTableComponent.clearSelections();
    this.urlTextarea.nativeElement.value = '';
  }

  handleDateChange(date: Date | Date[]) {
    if (Array.isArray(date)) {
      const startDate = date[0];
      let endDate = date[1];

      if (endDate === null) endDate = startDate;

      if (this.granularityValue === 'day') {
      this.dateRange = {
        start: dayjs(startDate)
          .utc()
          .format('YYYY-MM-DDT00:00:00.000') as AAQueryDateStart,
        end: dayjs(endDate)
          .utc()
          .format('YYYY-MM-DDT23:59:59.999') as AAQueryDateEnd,
      };
    } else if (this.granularityValue === 'week') {
      this.dateRange = {
        start: dayjs(startDate)
          .utc()
          .format('YYYY-MM-DDT00:00:00.000') as AAQueryDateStart,
        end: dayjs(endDate)
          .utc()
          .format('YYYY-MM-DDT23:59:59.999') as AAQueryDateEnd,
      };
    }
    else if (this.granularityValue === 'month') {
      this.dateRange = {
        start: dayjs(startDate)
          .utc()
          .format('YYYY-MM-DDT00:00:00.000') as AAQueryDateStart,
        end: dayjs(endDate)
          .utc()
          .format('YYYY-MM-DDT23:59:59.999') as AAQueryDateEnd,
      };
    }
    } else {
      this.dateRange = {
        start: '',
        end: '',
      };
    }
    this.config.update((f) => {
      return {
        ...f,
        dateRange: this.dateRange,
      };
    });
  }

  get urlsCount(): number {
    return this.urls.length;
  }

  get isAccordionExpanded(): boolean {
    return this.urlsCount < 10;
  }

  updateConfig() {
    this.config.update((f: ReportConfig) => {
      return {
        ...f,
        metrics: this.selectedReportMetrics,
        breakdownDimension: this.selectedReportDimensions as AADimensionName,
        grouped: this.isGrouped,
      };
    });
  }

  isMetricSelected(): boolean {
    return this.selectedReportMetrics.length > 0;
  }

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

  generateAndDownloadReport() {
    this.validationTriggered = true;

    // console.log('Report Configuration:', this.config());
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

  transformDimensionOptions(dimensions: ReportDimension[]) {
    return [
      { label: 'None', value: 'None' },
      ...dimensions.map((d) => ({ label: d.label, value: d.id })),
    ];
  }

  dimensionSelect(label: string) {
    this.dimensionLabel = label;
  }

  breakdownSelect(label: string) {
    this.breakdownLabel = label;
  }

  granularitySelect(label: string) {
    this.granularityLabel = label;
  }

  onGranularitySelect(event: any) {
    this.granularityValue = event;

    const selectedOption = this.granularityOptions.find(
      (option) => option.value === this.granularityValue,
    );

    this.granularityLabel = selectedOption ? selectedOption.label : 'Select';

    this.config.update((f) => ({
      ...f,
      granularity: this.granularityLabel === 'Select' ? 'none' : this.granularityValue as ReportGranularity,
    }));

    this.resetCalendar();
  }
  
  async createReport(config: ReportConfig) {

    if (this.isDateRangeValid() && this.areUrlsValid() && this.areMetricsValid() ) {

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
      this.router.navigateByUrl(`/en/custom-reports/${res._id}`),
    );
  } else {
    this.validationTriggered = true;
  }
  }
}