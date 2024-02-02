import type {
  ReportConfig,
  ReportCreateResponse,
  ReportStatus,
} from '@dua-upd/types-common';
import {
  Body,
  Controller,
  Get,
  Header,
  type MessageEvent,
  Param,
  Post,
  Sse,
} from '@nestjs/common';
import { map, Observable, of } from 'rxjs';
import { CustomReportsService } from './custom-reports.service';

@Controller('custom-reports')
export class CustomReportsController {
  constructor(private reportsService: CustomReportsService) {}

  @Post('create')
  async create(@Body() request: ReportConfig): Promise<ReportCreateResponse> {
    return { _id: await this.reportsService.create(request) };
  }

  @Get(':id')
  async getReport(@Param('id') id: string): Promise<ReportStatus> {
    const report = await this.reportsService.fetchOrPrepareReport(id);

    if (report) {
      return {
        status: 'complete',
        data: report,
      } as ReportStatus;
    }

    return { status: 'pending', message: 'fetching data...' };
  }

  @Sse(':id/status')
  getStatus(@Param('id') id: string): Observable<MessageEvent> {
    const reportStatus$ = this.reportsService.getStatusObservable(id);

    if (!reportStatus$) {
      return of({
        data: {
          status: 'error',
          message: 'report not found',
        },
      });
    }

    return reportStatus$.pipe(
      map((status) => ({
        data: status.error
          ? {
              ...status,
              message: 'Could not fetch report data',
            }
          : status,
      })),
    );
  }
}
