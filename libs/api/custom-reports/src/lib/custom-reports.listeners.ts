import {
  InjectQueue,
  OnQueueEvent,
  QueueEventsHost,
  QueueEventsListener,
} from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { filter, Subject } from 'rxjs';

export type ReportJobStatus = {
  jobId: string;
  status: 'pending' | 'complete' | 'error';
  totalChildJobs?: number;
  completedChildJobs?: number;
  data?: Record<string, unknown>[];
  error?: Error;
};

export type ChildJobStatus = {
  jobId: string;
  status: 'pending' | 'complete' | 'error';
  error?: Error;
};

@QueueEventsListener('fetchAndProcessReportData')
export class ChildQueueEvents extends QueueEventsHost {
  private globalChildJobEvents$ = new Subject<ChildJobStatus>();

  getReportChildrenObservable(childJobIds: string[]) {
    return this.globalChildJobEvents$.pipe(
      filter((event) => childJobIds.includes(event.jobId)),
    );
  }

  @OnQueueEvent('progress')
  onProgress({ jobId, data }: { jobId: string; data: number | object }) {
    console.log('progress: ', jobId, data);
  }

  @OnQueueEvent('error')
  onError(error: Error) {
    console.error(error.stack);
  }

  @OnQueueEvent('completed')
  async onCompleted({ jobId }: { jobId: string }) {
    this.globalChildJobEvents$.next({
      jobId,
      status: 'complete',
    });
  }

  @OnQueueEvent('active')
  onActive({ jobId }: { jobId: string }) {
    this.globalChildJobEvents$.next({
      jobId,
      status: 'pending',
    });
  }

  @OnQueueEvent('failed')
  onFailed({ jobId, failedReason }: { jobId: string; failedReason: string }) {
    console.error(jobId, failedReason);

    this.globalChildJobEvents$.next({
      jobId,
      status: 'error',
      error: new Error(failedReason),
    });
  }
}

@QueueEventsListener('prepareReportData')
export class ReportsQueueEvents extends QueueEventsHost {
  private globalReportEvents$ = new Subject<ReportJobStatus>();

  constructor(
    @InjectQueue('prepareReportData')
    private queue: Queue,
    private childQueueEvents: ChildQueueEvents,
  ) {
    super();
  }

  getReportObservable(reportId: string) {
    return this.globalReportEvents$.pipe(
      filter((event) => reportId === event.jobId),
    );
  }

  @OnQueueEvent('error')
  onError(error: Error) {
    console.error(error.stack);
  }

  @OnQueueEvent('completed')
  onCompleted({
    jobId,
    returnvalue,
  }: {
    jobId: string;
    returnvalue: Record<string, unknown>[];
  }) {
    console.log(`${jobId} complete!`);

    this.globalReportEvents$.next({
      jobId,
      status: 'complete',
      data: returnvalue,
    });
  }

  @OnQueueEvent('failed')
  onFailed({
    jobId,
    failedReason,
  }: {
    jobId: string;
    failedReason: string;
    prev?: string;
  }) {
    console.error('Job failed:');
    console.error(jobId, failedReason);

    this.globalReportEvents$.next({
      jobId,
      status: 'error',
      error: new Error(failedReason),
    });
  }
}
