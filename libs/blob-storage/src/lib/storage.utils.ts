import type { TransferProgressEvent } from '@azure/core-http';
import { throttle } from 'rambdax';

export const bytesToMbs = (bytes: number) => Math.round(bytes / 10) / 100000;

export const makeFileUploadProgressLogger = (fileSizeBytes: number) => {
  const fileMbs = bytesToMbs(fileSizeBytes);

  return throttle((event: TransferProgressEvent) => {
    const progressMbs = bytesToMbs(event.loadedBytes);

    console.log(
      `${progressMbs}MB / ${fileMbs}MB uploaded – (${Math.round(
        (progressMbs / fileMbs) * 100
      )}% complete)`
    );
  }, 500);
};
