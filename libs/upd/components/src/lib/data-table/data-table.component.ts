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
import type { ColumnConfig } from '@dua-upd/types-common';
import type { SelectedNode } from '../filter-table/filter-table.component';

@Component({
  selector: 'upd-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css'],
})
export class DataTableComponent<T> {
  @ViewChild('dt') table!: Table;
  @Input() displayRows = 10;
  @Input() sort = true;
  @Input() pagination = true;
  @Input() filter = true;
  @Input() filterTree = false;
  @Input() columnSelection = false;
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
  cols = input<ColumnConfig[]>([]);
  inputSearchFields = input<string[]>([], { alias: 'searchFields' });

  i18n = inject(I18nFacade);

  translatedData = this.i18n.toTranslatedTable<T>(this.data, this.cols);
  selectedColumns: WritableSignal<ColumnConfig[]> = signal([]);

  searchFields = computed(() =>
    this.inputSearchFields().length
      ? this.inputSearchFields()
      : this.cols().map((col) => col.field),
  );

  frozenCols: WritableSignal<ColumnConfig[]> = signal([]);

  allColumns = computed(() => [
    ...this.frozenCols(),
    ...this.selectedColumns(),
  ]);

  lang = this.i18n.currentLang;

  selectableCols = computed(() =>
    this.cols()
      .filter((col) => !col.frozen)
      .map((col) => ({
        original: col,
        translatedHeader: this.i18n.service.translate(col.header, this.lang()),
      }))
      .sort((a, b) => a.translatedHeader.localeCompare(b.translatedHeader))
      .map(({ original }) => original),
  );
  constructor() {
    effect(
      () => {
        this.translatedData();
        this.table?._filter();
        this.table?.clearState();

        this.frozenCols.set(this.cols().filter((col) => col.frozen));

        const selectableColumns = this.cols().filter(
          (col) => !col.hide && !col.frozen,
        );

        if (this.columnSelection) {
          const storageKey = `selectedColumns-${this.id}`;
          const stored = sessionStorage.getItem(storageKey);
          const storageSelectedColumns: ColumnConfig[] = stored
            ? JSON.parse(stored)
            : [];

          if (storageSelectedColumns.length > 0) {
            this.selectedColumns.set(storageSelectedColumns);
          } else {
            this.selectedColumns.set(selectableColumns);
          }
        } else {
          this.selectedColumns.set(selectableColumns);
        }
      },
      { allowSignalWrites: true },
    );
    effect(() => {
      const storageKey = `selectedColumns-${this.id}`;
      sessionStorage.setItem(
        storageKey,
        JSON.stringify(this.selectedColumns()),
      );
    });
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
    this.selectedColumns.set(selectedColumns);
  }
}
