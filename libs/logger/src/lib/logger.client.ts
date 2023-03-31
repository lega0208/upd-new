import { LogLevel } from '@nestjs/common';
import { BlobClient, BlobModel } from '@dua-upd/blob-storage';
import { prettyJson } from '@dua-upd/utils-common';
import { CustomLogger } from './logger.custom';

// "Targets" in this context means:
//  which log file should each log level write to?
export type LogLevelTargets = { [key in LogLevel]?: string };

export interface BlobLoggerConfig {
  context?: string;
  logLevelTargets: LogLevelTargets;
}
export interface ClassBlobLoggerConfig extends BlobLoggerConfig {
  blobModel: BlobModel;
}

export class BlobLogger extends CustomLogger {
  private blobModel: BlobModel;
  private logLevelTargets: LogLevelTargets;
  private targetBlobs: { [key in LogLevel]?: BlobClient } = {};

  constructor(config: ClassBlobLoggerConfig) {
    super(config.context);

    this.blobModel = config.blobModel;
    this.setLogLevelTargets(config.logLevelTargets);
  }

  setLogLevelTargets(logLevelTargets: LogLevelTargets) {
    this.logLevelTargets = logLevelTargets;

    const newTargetBlobs: { [key in LogLevel]?: BlobClient } = {};

    for (const [level, target] of Object.entries(this.logLevelTargets)) {
      newTargetBlobs[level] = this.blobModel.blob(target, 'append');
    }

    this.targetBlobs = newTargetBlobs;
  }

  setContext(context: string) {
    this.context = context;
  }

  log(message: string, ...text: unknown[]) {
    super.log(message, ...text);

    const mergedMessage = `${message} ${text.join(' ')}`;

    const formattedMessage = this.toFormat(mergedMessage, this.context, 'log');

    this.targetBlobs['log']?.append(formattedMessage).catch((err) => {
      super.error(
        `Error writing to log file (${this.targetBlobs['log'].filename})`
      );
      super.error(err.message, err.stack);
    });
  }

  info(message: string, ...text: unknown[]) {
    super.info(message, ...text);

    const mergedMessage = `${message} ${text.join(' ')}`;

    const formattedMessage = this.toFormat(mergedMessage, this.context, 'log');

    this.targetBlobs['log']?.append(formattedMessage).catch((err) => {
      super.error(
        `Error writing to log file (${this.targetBlobs['log'].filename})`
      );
      super.error(err.message, err.stack);
    });
  }

  accent(message: string, ...text: unknown[]) {
    super.accent(message, ...text);

    const mergedMessage = `${message} ${text.join(' ')}`;

    const formattedMessage = this.toFormat(mergedMessage, this.context, 'log');

    this.targetBlobs['log']?.append(formattedMessage).catch((err) => {
      super.error(
        `Error writing to log file (${this.targetBlobs['log'].filename})`
      );
      super.error(err.message, err.stack);
    });
  }

  error(message: unknown) {
    super.error(message + '\n');

    const formattedMessage = this.toFormat(
      message + '\n',
      this.context,
      'error'
    );

    this.targetBlobs['error']?.append(formattedMessage).catch((err) => {
      super.error(
        `Error writing to log file (${this.targetBlobs['error'].filename})`
      );
      super.error(err.message, err.stack);
    });
  }

  warn(message: string, ...text: unknown[]) {
    super.warn(message, ...text);

    const mergedMessage = `${message} ${text.join(' ')}`;

    const formattedMessage = this.toFormat(mergedMessage, this.context, 'warn');

    this.targetBlobs['warn']?.append(formattedMessage).catch((err) => {
      super.error(
        `Error writing to log file (${this.targetBlobs['warn'].filename})`
      );
      super.error(err.message, err.stack);
    });
  }
}
