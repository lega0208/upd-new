import {
  Component,
  Input,
  ViewChild,
  EventEmitter,
  Output,
  input,
  computed,
  inject,
  effect,
  signal,
  WritableSignal,
} from '@angular/core';
import { I18nFacade } from '@dua-upd/upd/state';
import { Table } from 'primeng/table';
import type { ColumnConfig, GroupedColumns } from '@dua-upd/types-common';
import type { SelectedNode } from '../filter-table/filter-table.component';
import { SelectItemGroup } from 'primeng/api';

@Component({
  selector: 'upd-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css'],
})
export class DataTableComponent<T extends object> {
  @ViewChild('dt') table!: Table;
  @Input() displayRows = 10;
  @Input() sort = true;
  @Input() pagination = true;
  @Input() filter = true;
  @Input() filterTree = false;
  @Input() captionTitle = '';
  @Input() loading = false;
  @Input() sortField = '';
  @Input() sortOrder: 'asc' | 'desc' = 'asc';
  @Input() kpi = false;
  @Input() exports = true;
  @Input() checkboxes = false;
  @Input() id?: string;
  @Input() placeholderText = 'dt_search_keyword';
  @Input() selectedNodes: SelectedNode[] = [];
  @Input() node: SelectedNode | null = null;

  @Output() rowSelectionChanged = new EventEmitter<T[]>();

  data = input<T[] | null>(null);
  cols = input<ColumnConfig<T>[]>([]);
  inputSearchFields = input<string[]>([], { alias: 'searchFields' });
  columnSelection = input(false);

  i18n = inject(I18nFacade);

  translatedData = this.i18n.toTranslatedTable<T>(this.data, this.cols);

  selectedColumns: WritableSignal<ColumnConfig<T>[]> = signal(
    JSON.parse(sessionStorage.getItem(`selectedColumns-${this.id}`) || '[]'),
  );

  searchFields = computed(() =>
    this.inputSearchFields().length
      ? this.inputSearchFields()
      : this.cols().map((col) => col.field),
  );

  displayColumns = computed(() => {
    if (!this.selectedColumns()?.length || !this.columnSelection()) {
      return this.cols().filter((col) => !col.hide);
    }

    return this.cols().filter(
      (col) =>
        col.frozen ||
        this.selectedColumns()
          ?.map(({ field }) => field)
          .includes(col.field),
    );
  });

  lang = this.i18n.currentLang;

  // selectableCols = computed(() =>
  //   this.cols()
  //     .filter((col) => !col.frozen)
  //     .map((col) => ({
  //       original: col,
  //       translatedHeader: this.i18n.service.translate(col.header, this.lang()),
  //     }))
  //     .sort((a, b) => a.translatedHeader.localeCompare(b.translatedHeader))
  //     .map(({ original }) => original),
  // );
//---------------------------------
// Inside your class or component
selectableCols = computed(() => {
  const defaultLabel = 'Other';

  // Define 'grouped' with an appropriate type
  const grouped: GroupedColumns = this.cols()
    .filter((col: ColumnConfig) => !col.frozen)
    .reduce((acc: GroupedColumns, col: ColumnConfig) => {
      const label = col.label || defaultLabel; // Use default label if none is specified
      if (!acc[label]) {
        acc[label] = [];
      }
      acc[label].push({
        ...col,
        header: this.i18n.service.translate(col.header, this.lang()),
      });
      return acc;
    }, {} as GroupedColumns); // Initial value of the accumulator

  // Convert the grouped object into an array
  return Object.keys(grouped).map(label => ({
    label,
    items: grouped[label]
  }))

});


//---------------------------------

  constructor() {
    effect(() => {
      this.translatedData();
      this.table?._filter();
      this.table?.clearState();
    });
    effect(
      () => {
        const selectedColumns = this.selectedColumns();

        const initialColumns: ColumnConfig<T>[] =
          JSON.parse(
            sessionStorage.getItem(`selectedColumns-${this.id}`) || '[]',
          ) || this.cols().filter((col) => !col.hide && !col.frozen);

        if (!selectedColumns.length && initialColumns.length) {
          this.selectedColumns.set(initialColumns);
          return;
        }
      },
      { allowSignalWrites: true },
    );
  }

  selectedRows: T[] = [];

  onSelectionChange(value = []) {
    this.selectedRows = value;
    this.rowSelectionChanged.emit(value);
  }

  clearSelections() {
    this.selectedRows = [];
    this.rowSelectionChanged.emit(this.selectedRows);
  }

  getEventValue(event: Event): string {
    return (event.target as HTMLInputElement).value.replace(
      /^.+?(?=www\.)/i,
      '',
    );
  }

  updateSelectedNodes(nodes: SelectedNode[]) {
    this.selectedNodes = nodes;
  }

  removeNode(node: SelectedNode) {
    this.node = node;
  }

  selectedColumnsChanged(selectedColumns: ColumnConfig[]) {
    sessionStorage.setItem(
      `selectedColumns-${this.id}`,
      JSON.stringify(selectedColumns),
    );

    this.selectedColumns.set(selectedColumns);
  }
}
