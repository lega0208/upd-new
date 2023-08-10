import { Component, Input } from '@angular/core';
import { formatDate, formatPercent, formatNumber } from '@angular/common';
import { NgbPopoverConfig } from '@ng-bootstrap/ng-bootstrap';
import dayjs from 'dayjs';
import autoTable, { RowInput } from 'jspdf-autotable';
import * as FileSaver from 'file-saver';
import { ColumnConfig } from '../data-table-styles/types';
import { DropdownOption } from '../dropdown/dropdown.component';
import { I18nFacade } from '@dua-upd/upd/state';
import { ProjectStatus } from '@dua-upd/types-common';
import { FilterMetadata } from 'primeng/api';

@Component({
  selector: 'upd-data-table-exports',
  template: `
    <upd-dropdown
      [options]="exportOptions"
      label="{{ 'Export' | translate }}"
      [id]="'exports-' + id"
      [onSelect]="this.exportFile.bind(this)"
      icon="file_download"
    >
    </upd-dropdown>
  `,
  styles: [],
  providers: [NgbPopoverConfig],
})
export class DataTableExportsComponent<T> {
  utf8Encoder = new TextEncoder();
  exportOptions: DropdownOption<'csv' | 'pdf' | 'xlsx'>[] = [
    {
      label: 'CSV',
      icon: 'file',
      value: 'csv',
    },
    {
      label: 'PDF',
      icon: 'file-pdf',
      value: 'pdf',
    },
    {
      label: 'XLSX',
      icon: 'file-excel',
      value: 'xlsx',
    },
  ];

  @Input() id!: string;
  @Input() data: T[] = [];
  @Input() cols: ColumnConfig<T>[] = [];
  @Input() filters: {
    [s: string]: FilterMetadata | FilterMetadata[] | undefined;
  } = {};

  constructor(config: NgbPopoverConfig, private i18n: I18nFacade) {
    config.placement = 'right';
    config.triggers = 'hover focus';
  }

  async getFormattedExportData(replaceKeysWithHeaders = false) {
    const currentLang = this.i18n.service.currentLang;
    const cops = this.i18n.service.translate('COPS', currentLang);

    let globalFilterValue = '';

    const globalFilterString = this.filters['global'];
    if (globalFilterString) {
      globalFilterValue = Array.isArray(globalFilterString)
        ? globalFilterString[0].value
        : globalFilterString.value;
    }

    let filteredData = this.data;

    if (globalFilterValue) {
      filteredData = this.data.filter((row: T) => {
        return Object.entries(row as keyof T).some(
          ([key, value]: [string, unknown]) => {
            if (
              key === '_id' ||
              key === 'id' ||
              value === null ||
              value === undefined
            )
              return false;

            const valueIncludesGlobalSearchTerm = (val: unknown): boolean => {
              if (typeof val === 'string') {
                return val.toLowerCase().includes(globalFilterValue);
              } else if (typeof val === 'number' || typeof val === 'boolean') {
                return val.toString().includes(globalFilterValue);
              } else if (val instanceof Date) {
                return val.toISOString().includes(globalFilterValue);
              } else if (Array.isArray(val)) {
                return val.some((element) =>
                  valueIncludesGlobalSearchTerm(element)
                );
              } else {
                return false;
              }
            };

            return valueIncludesGlobalSearchTerm(value);
          }
        );
      });
    }

    const specificFilteredData = filteredData.filter((row: T) => {
      return Object.entries(row as keyof T).every(
        ([key, value]: [string, unknown]) => {
          const filterData = this.filters[key];
          if (!filterData) return true;

          const specificFilters: FilterMetadata[] = Array.isArray(filterData)
            ? filterData
            : [filterData];
          if (!specificFilters.length) return true;

          return specificFilters.some((filter) => {
            if (filter.value === null) return true;
            if (filter.matchMode === 'in' && Array.isArray(filter.value)) {
              return new Set(filter.value).has(value as string);
            } else if (
              filter.matchMode === 'arrayFilter' &&
              Array.isArray(filter.value) &&
              Array.isArray(value)
            ) {
              const valueSet = new Set(value);
              return filter.value.some((element) => valueSet.has(element));
            } else if (
              filter.matchMode === 'contains' &&
              typeof value === 'boolean'
            ) {
              return filter.value === value;
            }
            return false;
          });
        }
      );
    });

    if (specificFilteredData.length === 0) {
      specificFilteredData.push({} as T);
    }

    const projectStatusKeys: ProjectStatus[] = [
      'Unknown',
      'Complete',
      'Delayed',
      'Paused',
      'Exploratory',
      'Being monitored',
      'In Progress',
      'Needs review',
      'Planning',
    ];

    const projectStatuses = (await this.i18n.service.get(
      projectStatusKeys
    )) as Record<string, string>;

    return specificFilteredData.map((row) =>
      this.cols.reduce((formattedRow, col) => {
        const colKey = replaceKeysWithHeaders ? col.header : col.field;

        if (!row[col.field as keyof T]) {
          formattedRow[colKey] = '';
        } else if (col.pipe === 'percent') {
          formattedRow[colKey] = formatPercent(
            (<unknown>row[col.field as keyof T]) as number,
            currentLang
          );
        } else if (col.pipe === 'number') {
          formattedRow[colKey] = formatNumber(
            (<unknown>row[col.field as keyof T]) as number,
            currentLang
          );
        } else if (col.pipe === 'date') {
          formattedRow[colKey] = formatDate(
            (<unknown>row[col.field as keyof T]) as Date,
            col.pipeParam ?? 'YYYY-MM-dd',
            currentLang
          );
        } else if (col.typeParam === 'cops') {
          formattedRow[colKey] = row[col.field as keyof T] ? cops : '';
        } else if (col.type === 'label') {
          formattedRow[colKey] =
            projectStatuses[(<unknown>row[col.field as keyof T]) as string];
        } else {
          formattedRow[colKey] = (<unknown>row[col.field as keyof T]) as string;
        }

        return formattedRow;
      }, {} as Record<string, string>)
    );
  }

  async exportCsv() {
    if (this.data.length) {
      const data = await this.getFormattedExportData(true);

      const headerRow = Object.keys(data[0]).map(
        (header: string) => `"${header}"`
      );
      const dataRows = data.map((row) =>
        Object.values(row).map((cellData) => `"${cellData}"`)
      );

      const csvData = [headerRow, ...dataRows];

      const csvOutput = csvData.map((csvRow) => csvRow.join(',')).join('\n');

      // UTF-8 Byte-order mark (so that Excel knows to use UTF-8)
      // https://en.wikipedia.org/wiki/Byte_order_mark#Byte_order_marks_by_encoding
      const BOM = Uint8Array.from([0xef, 0xbb, 0xbf]);

      const encodedCsv = this.utf8Encoder.encode(csvOutput);

      const blob = new Blob([BOM, encodedCsv], {
        type: 'text/csv;charset=utf-8;',
        endings: 'native',
      });

      const date = dayjs().format('YYYY-MM-DD');

      FileSaver.saveAs(blob, `upd-data-table_export_${date}.csv`, {
        autoBom: false,
      });
    }
  }

  async exportPdf() {
    const jsPdf = await import('jspdf');

    try {
      const columnsExport = this.cols.map((obj) => ({
        dataKey: obj.field,
        title: obj.header,
      }));

      const minCellWidth =
        columnsExport.length === 1 ? 100 : 100 / (columnsExport.length - 1);

      const doc = new jsPdf.default('p', 'mm', 'a4');

      autoTable(doc, {
        styles: { halign: 'left' },
        body: (await this.getFormattedExportData()) as RowInput[],
        bodyStyles: { overflow: 'linebreak', minCellWidth: minCellWidth },
        columns: columnsExport,
      });

      const date = dayjs().format('YYYY-MM-DD');

      await doc.save(`upd-table-data_export_${date}.pdf`);
    } catch (err) {
      console.error('Error exporting PDF file:', err);
    }
  }

  async exportExcel() {
    const xlsx = await import('xlsx');

    try {
      if (this.data && this.data.length > 0) {
        // Create a new object using only data used in the table and
        // replacing the keys with the appropriate headers

        const exportData = await this.getFormattedExportData(true);

        const worksheet = xlsx.utils.json_to_sheet(exportData);
        const workbook = {
          Sheets: { data: worksheet },
          SheetNames: ['data'],
        };
        const excelBuffer: ArrayBuffer = xlsx.write(workbook, {
          bookType: 'xlsx',
          type: 'array',
        });

        this.saveAsExcelFile(excelBuffer, 'upd-data-table');
      }
    } catch (err) {
      console.error('Error exporting Excel file:', err);
    }
  }

  saveAsExcelFile(buffer: ArrayBuffer, fileName: string) {
    const date = dayjs().format('YYYY-MM-DD');

    const data = new Blob([buffer], {
      type: 'application/octet-stream',
      endings: 'native',
    });

    FileSaver.saveAs(data, `${fileName}_export_${date}.xlsx`);
  }

  async exportFile(fileType: 'csv' | 'pdf' | 'xlsx') {
    switch (fileType) {
      case 'csv':
        await this.exportCsv();
        break;
      case 'pdf':
        await this.exportPdf();
        break;
      case 'xlsx':
        await this.exportExcel();
    }
  }
}
