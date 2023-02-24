import { Inject, Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { I18nFacade } from '@dua-upd/upd/state';

import { LocaleId } from '@dua-upd/upd/i18n';
import { TreeNode } from 'primeng/api';
import { ColumnConfig } from '../data-table-styles/types';

@Injectable()
export class FilterTableStore extends ComponentStore<TreeNode[]> {
  constructor(private readonly i18n: I18nFacade) {
    super([{ label: 'Loading...' }]);
  }

  readonly setData = this.updater((state, value: any): TreeNode[] => {
    const map = new Map();
    const cols: ColumnConfig[] = value[1];

    value[0].forEach((item: any) => {
      Object.entries(item).forEach(([key, value]) => {
        if (!map.has(key)) {
          map.set(key, new Set());
        }
        if (Array.isArray(value)) {
          value.forEach((v) => map.get(key).add(v));
        } else {
          map.get(key).add(value);
        }
      });
    });

    const nodes: TreeNode[] = [];
    map.forEach((value, key) => {
      const column = cols.find((col) => col.field === key);
      if (!column?.displayFilterOptions) {
        return;
      }
      const header = column?.header || key;
      nodes.push({
        label: header,
        data: `${key}:${header}`,
        key: `${key}:${header}`,
        children: Array.from(value as Set<string>)
          .filter((v) => v !== '')
          .map((v) => {
            // const l = column.pipe === 'date' ? this.datePipe.transform(v, column.pipeParam, 'UTC', 'en')?.toString() : v;
            return {
              label: v,
              data: `${key}:${v}`,
              key: `${key}:${v}`,
            };
          }),
      });
    });
    return nodes;
  });

  readonly setLabels = this.updater((state, lang: LocaleId): TreeNode[] => {
    return state.map((node) => {
      const [key, label] = node.data.split(':');
      return {
        ...node,
        label: this.i18n.service.translate(label, lang),
        children: (node.children as TreeNode[]).map((child) => {
          const [key, label] = child.data.split(':');
          return {
            ...child,
            label: this.i18n.service.translate(label, lang),
          };
        }),
      };
    });
  });

  readonly vm$ = this.select(this.state$, (state) => state);
}
