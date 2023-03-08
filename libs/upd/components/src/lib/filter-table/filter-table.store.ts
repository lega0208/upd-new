import { Inject, Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { I18nFacade } from '@dua-upd/upd/state';

import { LocaleId } from '@dua-upd/upd/i18n';
import { TreeNode } from 'primeng/api';
import { ColumnConfig } from '../data-table-styles/types';

@Injectable()
export class FilterTableStore<T extends { [key: string]: unknown; }> extends ComponentStore<TreeNode[]> {
  constructor(private readonly i18n: I18nFacade) {
    super([{ label: 'Loading...' }]);
  }

  readonly setData = this.updater((state, value: [T[], ColumnConfig<T>[]]): TreeNode[] => {
    const map = new Map();
    const cols: ColumnConfig<T>[] = value[1];
    const data: T[] = value[0];

    for (const item of data) {
      for (const [key, val] of Object.entries(item)) {
        if (!map.has(key)) {
          map.set(key, new Set());
        }
        if (Array.isArray(val)) {
          for (const v of val) {
            map.get(key).add(v);
          }
        } else {
          map.get(key).add(val);
        }
      }
    }

    const nodes: TreeNode[] = [];

    for (const [key, value] of map.entries()) {
      const column = cols.find((col) => col.field === key);
      if (!column || column.pipe === 'number') {
        continue;
      }
      const header = column?.header || key;
      nodes.push({
        label: header,
        data: `${key}:${header}`,
        key: `${key}:${header}`,
        children: Array.from(value as Set<string>)
          .filter((v) => v !== '')
          .map((v) => {
            return {
              label: v,
              data: `${key}:${v}`,
              key: `${key}:${v}`,
            };
          }),
      });
    }

    return nodes;
  });

  readonly setLabels = this.updater((state, lang: LocaleId): TreeNode[] => {
    const nodes = state.map((node) => {
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

    return sortNodes(nodes);
  });

  readonly vm$ = this.select(this.state$, (state) => state);
}


function sortNodes(nodes: TreeNode[]): TreeNode[] {
  for (const node of nodes) {
    if (node.children) {
      sortNodes(node.children);
    }
  } 
  return nodes.sort((a, b) => (a.label as string).localeCompare(b.label as string));
}
