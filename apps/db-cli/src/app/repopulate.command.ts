import {
  CommandRunner,
  InquirerService,
  Option,
  SubCommand,
  QuestionSet,
  Question,
} from 'nest-commander';
import { DbUpdateService } from '@cra-arc/db-update';
import { DataIntegrityService } from '@cra-arc/data-integrity';

@QuestionSet({ name: 'repopulate' })
export class UpdateQuestions {
  @Question({
    message: 'What collection would you like to repopulate?',
    name: 'target',
    type: 'list',
    choices: ['feedback'],
    default: 'feedback',
  })
  parseUpdate(str: string): string {
    return str;
  }
}

@SubCommand({
  name: 'repopulate',
  description: 'Repopulate a database collection',
})
export class UpdateCommand implements CommandRunner {
  constructor(
    private readonly inquirerService: InquirerService,
    private dataIntegrityService: DataIntegrityService,
    private dbUpdateService: DbUpdateService
  ) {}

  async run(inputs: string[], options?: Record<string, any>) {
    const target =
      options?.target ||
      options?.calldrivers ||
      options?.all ||
      (
        await this.inquirerService.prompt<{ target: string }>('repopulate', {
          ...options,
        })
      ).target;

    if (/^feedback$/i.test(target)) {
      await this.dbUpdateService.repopulateFeedback();
      return;
    }
  }

  @Option({
    flags: '-fb, --feedback',
    description: 'Repopulate the feedback collection',
    defaultValue: false,
  })
  parseFeedback(feedback: boolean) {
    return feedback && 'feedback';
  }
}
