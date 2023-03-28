import {
  ConsoleLogger,
  type ConsoleLoggerOptions,
  LoggerService,
  LogLevel,
} from '@nestjs/common';
import chalk from 'chalk';

const violet = chalk.hex('#52489C');
const blue = chalk.hex('#4062BB');
const red = chalk.hex('#D72638');
const white = chalk.hex('#EBEBEB');
const orange = chalk.hex('#F49D37');

export class CustomLogger extends ConsoleLogger implements LoggerService {
  constructor(context?: string, options?: ConsoleLoggerOptions) {
    super(context, options);
  }

  setContext(context: string) {
    super.setContext(context);
  }

  log(message: string, ...text: unknown[]) {
    super.log(white(message, ...text));
  }

  info(message: string, ...text: unknown[]) {
    super.log(blue(message, ...text));
  }

  accent(message: string, ...text: unknown[]) {
    super.log(violet(message, ...text));
  }

  error(message: unknown, stack?: string) {
    if (stack) {
      super.error(red(message), red(stack), this.context);
    } else {
      super.error(red(message), this.context);
    }
  }

  warn(message: string, ...text: unknown[]) {
    super.warn(orange(message, ...text));
  }

  toFormat(message: string, context = '', logLevel: LogLevel = 'log') {
    const pidMessage = super.formatPid(process.pid);

    const contextMessage = context ? `[${context}] ` : '';

    const formattedLogLevel = logLevel.toUpperCase().padStart(7, ' ');

    return `${pidMessage}${super.getTimestamp()} ${formattedLogLevel} ${contextMessage}${message}\n`;
  }
}
