import { Question, QuestionSet } from 'nest-commander';

@QuestionSet({ name: 'populate_collection' })
export class PopulateCollectionPrompt {
  @Question({
    message: 'What collection would you like to populate?',
    name: 'targetCollection',
    type: 'list',
    choices: ['pages_metrics', 'overall_metrics'],
  })
  parseTargetCollection(targetCollection: string) {
    return targetCollection;
  }
}

@QuestionSet({ name: 'populate_overall' })
export class PopulateOverallPrompt {
  @Question({
    message: 'Populate metrics or search terms?',
    name: 'metricsOrSearchTerms',
    type: 'list',
    choices: ['metrics', 'search terms', 'both'],
  })
  parseMetricsOrSearchTerms(choice: 'metrics' | 'search terms' | 'both') {
    return choice;
  }
}

@QuestionSet({ name: 'populate_pages' })
export class PopulatePagesPrompt {
  @Question({
    // more options to be added (activity map, where visitors came from, etc.)
    message: 'Populate metrics or search terms?',
    name: 'metricsOrSearchTerms',
    type: 'list',
    choices: ['metrics', 'search terms', 'activity map', 'all'],
  })
  parseMetricsOrSearchTerms(choice: string) {
    return choice;
  }
}

@QuestionSet({ name: 'populate_collection_options' })
export class PopulateCollectionOptionsPrompt {
  @Question({
    message: 'Enter start date (YYYY-MM-DD)',
    name: 'startDate',
    type: 'input',
  })
  parseStartDate(startDate: string) {
    if (!startDate) {
      throw Error('No input received');
    }

    const dateRegex = /(\d{4})-(\d{2})-(\d{2})/;

    if (!dateRegex.test(startDate)) {
      throw Error('Invalid date format (expected YYYY-MM-DD)');
    }

    const year = parseInt(dateRegex.exec(startDate)[1]);
    const month = parseInt(dateRegex.exec(startDate)[2]);
    const day = parseInt(dateRegex.exec(startDate)[3]);

    if (year < 2019) {
      throw Error(`Invalid year input: ${year} - Expected 2019 or later`);
    }

    if (month < 1 || month > 12) {
      throw Error(`Invalid month input: ${month}`);
    }

    if (day < 1 || day > 31) {
      throw Error(`Invalid day input: ${day}`);
    }

    return startDate;
  }

  @Question({
    message: 'Enter end date (YYYY-MM-DD)',
    name: 'endDate',
    type: 'input',
  })
  parseEndDate(endDate: string) {
    if (!endDate) {
      throw Error('No input received');
    }

    const dateRegex = /(\d{4})-(\d{2})-(\d{2})/;

    if (!dateRegex.test(endDate)) {
      throw Error('Invalid date format (expected YYYY-MM-DD)');
    }

    const year = parseInt(dateRegex.exec(endDate)[1]);
    const month = parseInt(dateRegex.exec(endDate)[2]);
    const day = parseInt(dateRegex.exec(endDate)[3]);

    if (year < 2019) {
      throw Error(`Invalid year input: ${year} - Expected 2019 or later`);
    }

    if (month < 1 || month > 12) {
      throw Error(`Invalid month input: ${month}`);
    }

    if (day < 1 || day > 31) {
      throw Error(`Invalid day input: ${day}`);
    }

    return endDate;
  }
}
