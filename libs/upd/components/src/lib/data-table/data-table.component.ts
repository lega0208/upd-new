import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Table } from 'primeng/table';
import { ColumnConfig } from '../data-table-styles/types';
import autoTable from 'jspdf-autotable';
import * as FileSaver from 'file-saver';
import { formatDate } from '@angular/common';

@Component({
  selector: 'upd-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: [
    './data-table.component.css',
    '../project-status-label/project-status-label.component.scss',
  ],
})
export class DataTableComponent implements OnInit {
  @ViewChild('dt') table!: Table;
  @Input() data: unknown[] | null = [];
  @Input() displayRows = 10;
  @Input() sort = true;
  @Input() pagination = true;
  @Input() filter = true;
  @Input() cols: ColumnConfig[] = [];
  @Input() searchFields: string[] = [];
  @Input() captionTitle = '';
  @Input() loading = false;
  @Input() sortField = '';
  @Input() sortOrder = 'asc';
  @Input() sorting = 1;
  @Input() kpi = false;

  columnsExport: any[] = [];

  rangeValues: number[] = [0, 100];

  ngOnInit(): void {
    if (this.searchFields.length === 0) {
      this.searchFields = this.cols.map((obj) => obj.field);
    }
    if (this.sortOrder === 'desc' || this.sortOrder === 'descending') {
      this.sorting = -1;
    } else {
      this.sorting = 1;
    }
    this.columnsExport = this.cols.map((obj) => ({
      dataKey: obj.field,
      title: obj.header,
    }));
  }

  convertToPercent(e: number[]): number[] {
    return e.map((elem) => elem / 100);
  }

  dateFormat(e: Date): string {
    return formatDate(e, 'yyyy-MM-dd', 'en-US').toString();
  }

  minValue(numberField: number[]): number {
    return Math.min(...numberField);
  }

  maxValue(numberField: number[]): number {
    return Math.max(...numberField);
  }

  exportPdf() {
    const minCellWidth = 100 / (this.columnsExport.length - 1);
    import('jspdf').then((jsPDF) => {
      const doc = new jsPDF.default('p', 'mm', 'a4');
      autoTable(doc, {
        styles: { halign: 'center' },
        body: this.data as any[],
        bodyStyles: { overflow: 'linebreak', minCellWidth: minCellWidth },
        columns: this.columnsExport,
      });
      doc.save('upd-table-data_export_' + new Date().getTime() + '.pdf');
    });
  }

  exportExcel() {
    import('xlsx').then((xlsx) => {
      const worksheet = xlsx.utils.json_to_sheet(this.data as any);
      const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
      const excelBuffer = xlsx.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
      });
      this.saveAsExcelFile(excelBuffer, 'upd-data-table');
    });
  }

  saveAsExcelFile(buffer: any, fileName: string): void {
    const EXCEL_TYPE =
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const EXCEL_EXTENSION = '.xlsx';
    const data: Blob = new Blob([buffer], {
      type: EXCEL_TYPE,
    });
    FileSaver.saveAs(
      data,
      fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION
    );
  }
}
