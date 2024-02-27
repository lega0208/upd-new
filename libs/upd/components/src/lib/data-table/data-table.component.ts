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

  searchFields = computed(() =>
    this.inputSearchFields().length
      ? this.inputSearchFields()
      : this.cols().map((col) => col.field),
  );

  exportCols = computed(() => this.cols().filter((col) => !col.hide));

  constructor() {
    effect(() => {
      this.translatedData(); // trigger on lang/cols/data
      this.table?._filter();
      this.table?.clearState();
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
}
