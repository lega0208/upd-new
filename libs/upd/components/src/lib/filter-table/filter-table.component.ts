import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { LocaleId } from '@dua-upd/upd/i18n';
import { I18nFacade } from '@dua-upd/upd/state';
import { TreeNode } from 'primeng/api';
import { Table } from 'primeng/table';
import { TreeSelect } from 'primeng/treeselect';

import { FilterTableStore } from './filter-table.store';
import { FilterService } from 'primeng/api';
import { ColumnConfig } from '../data-table-styles/types';

interface SelectedNode {
  header: string;
  label: string;
  value: string;
}
[];

@Component({
  selector: 'upd-filter-table',
  templateUrl: './filter-table.component.html',
  styleUrls: ['./filter-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [FilterTableStore],
})
export class FilterTableComponent implements OnInit {
  @Input() cols: ColumnConfig[] = [];
  _data: any[] = [];
  @Input() set data(value: any[]) {
    this._data = value;

    const d = [this._data, this.cols];
    this.filterTableStore.setData(d);
    this.i18n.currentLang$.subscribe((lang) => {
      this.filterTableStore.setLabels(lang);
      this.updateNodeLabels(lang);
    });
  }

  get data() {
    return this._data;
  }

  selectedItems: any[] = [];
  selectedNodes: SelectedNode[] = [];

  @Input() table!: Table;
  @ViewChild('treeSelect') treeSelect!: TreeSelect;

  readonly vm$ = this.filterTableStore.vm$;

  constructor(
    private i18n: I18nFacade,
    private readonly filterTableStore: FilterTableStore,
    private filterService: FilterService
  ) {}

  ngOnInit() {
    this.filterService.register('arrayFilter', arrayFilter);
  }

  private updateNodeLabels(lang: LocaleId) {
    const headers = new Set<string>();

    if (this.selectedNodes.length > 0) {
      for (const node of this.selectedNodes) {
        const [data, child] = node.header.split(':');
        node.label = this.i18n.service.translate(child, lang);
        node.value = this.i18n.service.translate(data, lang);

        headers.add(node.header);
        headers.add(`${data}:${data}`);
      }

      this.selectedItems = Array.from(headers).map((header) => {
        this.tableFilter(header);
        return { key: header };
      });

      this.treeSelect.value = this.selectedItems;
    }
  }

  private handleNodeSelectUnselect(
    { node }: { node: TreeNode },
    isSelect: boolean
  ) {
    const { label, data, parent } = node;
    const parentValue = parent?.label as string;
    const selectedNode = node.children
      ? node.children.map((child) => ({
          header: `${data.split(':')[0]}:${child.data.split(':')[1]}`,
          label: child.label as string,
          value: label as string,
        }))
      : [
          {
            header: data,
            label: label as string,
            value: parentValue,
          },
        ];
    selectedNode.forEach((node) => {
      const nodeExists = this.selectedNodes.find(
        ({ header, label }) =>
          header.includes(data.split(':')[0]) && label === node.label
      );
      if ((isSelect && !nodeExists) || (!isSelect && nodeExists)) {
        isSelect
          ? this.selectedNodes.push(node)
          : this.deleteSelectedNode(node);
      }
    });
    this.tableFilter(data);
  }

  private deleteSelectedNode(nodeToDelete: SelectedNode) {
    this.selectedNodes = this.selectedNodes.filter((selectedNode) => {
      return (
        selectedNode.header !== nodeToDelete.header ||
        selectedNode.label !== nodeToDelete.label ||
        selectedNode.value !== nodeToDelete.value
      );
    });
  }

  onNodeSelect(event: { node: TreeNode }) {
    this.handleNodeSelectUnselect(event, true);
  }

  onNodeUnselect(event: { node: TreeNode }) {
    this.handleNodeSelectUnselect(event, false);
  }

  clearNodes() {
    this.treeSelect.value = [];
    this.selectedNodes = [];
    this.table.filters = {};
    this.table?.clear();
  }

  deleteFilter(node: SelectedNode) {
    this.selectedNodes = this.selectedNodes.filter(
      (n) => n.header !== node.header || n.label !== node.label
    );
    this.tableFilter(node.header);
    this.treeSelect.value = this.treeSelect.value.filter(
      (n: { key: string; label: string }) => n.key !== node.header
    );
  }

  private tableFilter(header: string) {
    const [data] = header.split(':');
    const filteredData = this.selectedNodes
      .filter((node) => node.header.includes(data))
      .map((node) => node.header.split(':')[1]);

    const filterType = filterMode(this.data, data);

    this.table?.filter(filteredData, data, filterType);

    console.log(this.table.filters);

    // const filterType = Array.isArray(value[0]) ? 'arrayFilter' : 'in';
    // this.table?.filter(true, data, filterType);

    // this.table.filters[data] = [{ value: filteredData.length === 0 ? null : filteredData, matchMode: filterType }];
  }

  get nodeSelectionCount() {
    return this.selectedNodes.length;
  }
}

const arrayFilter = (value: string[], filters: string[]): boolean => {
  if (
    filters === undefined ||
    filters === null ||
    filters.length === 0 ||
    !filters
  ) {
    return true;
  }

  if (value === undefined || value === null || !value) {
    return false;
  }

  return filters.some((v) => value.includes(v));
};

const filterMode = (data: any, header: string) => {
  const d = data
    .map((v: any) => v[header])
    .filter((v: any) => v !== null && v !== undefined && v !== '');

  if (d.every((v: any) => typeof v === 'boolean')) {
    return 'equals';
  } else if (d.every((v: any) => Array.isArray(v))) {
    return 'arrayFilter';
  } else if (d.every((v: any) => isValidDate(v))) {
    return 'arrayFilter';
  } else {
    return 'in';
  }
};

function isValidDate(str: string) {
  const noSpace = str.replace(/\s/g, '');
  if (noSpace.length < 3) {
    return false;
  }
  return Date.parse(noSpace) > 0;
}
