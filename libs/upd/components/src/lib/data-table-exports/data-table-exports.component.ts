import { Component, Input } from '@angular/core';
import { NgbPopoverConfig } from '@ng-bootstrap/ng-bootstrap';
import autoTable, { RowInput } from 'jspdf-autotable';
import * as FileSaver from 'file-saver';
import { ColumnConfig } from '../data-table-styles/types';

@Component({
  selector: 'upd-data-table-exports',
  template: `
    <div class="flex">
      <button
        type="button"
        pButton
        icon="pi pi-file"
        (click)="exportCsv()"
        class="mr-2 exportButtons"
        ngbTooltip="{{ 'CSV' | translate }}"
      ></button>
      <button
        type="button"
        pButton
        icon="pi pi-file-pdf"
        (click)="exportPdf()"
        class="p-button-warning mr-2 exportButtons"
        ngbTooltip="{{ 'PDF' | translate }}"
      ></button>
      <button
        type="button"
        pButton
        icon="pi pi-file-excel"
        (click)="exportExcel()"
        class="p-button-success mr-2 exportButtons"
        ngbTooltip="{{ 'XLSX' | translate }}"
      ></button>
    </div>
  `,
  styles: [],
  providers: [NgbPopoverConfig],
})
export class DataTableExportsComponent<T> {
  @Input() data: T[] = [];
  @Input() cols: ColumnConfig<T>[] = [];
  @Input() exportCsv: () => void = () => null;

  constructor(config: NgbPopoverConfig) {
    config.placement = 'right';
    config.triggers = 'hover focus';
  }

  async exportPdf() {
    const jsPdf = await import('jspdf');

    try {
      const columnsExport = this.cols.map((obj) => ({
        dataKey: obj.field,
        title: obj.header,
      }));

      const minCellWidth = 100 / (columnsExport.length - 1);

      const doc = new jsPdf.default('p', 'mm', 'a4');

      autoTable(doc, {
        styles: { halign: 'center' },
        body: this.data as unknown as RowInput[],
        bodyStyles: { overflow: 'linebreak', minCellWidth: minCellWidth },
        columns: columnsExport,
      });

      await doc.save('upd-table-data_export_' + new Date().getTime() + '.pdf');
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

        const exportData = this.data.map((row) => {
          return Object.fromEntries(
            this.cols.map((col) => [col.header, row[col.field as keyof T]])
          );
        });

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
    const timestamp = new Date().getTime();

    const data: Blob = new Blob([buffer], {
      type: 'application/octet-stream',
    });

    FileSaver.saveAs(data, `${fileName}_export_${timestamp}.xlsx`);
  }
}
