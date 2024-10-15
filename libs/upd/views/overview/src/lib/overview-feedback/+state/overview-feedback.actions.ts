import { createActionGroup, emptyProps, props } from '@ngrx/store';
import type { OverviewFeedback } from '@dua-upd/types-common';

export const OverviewFeedbackActions = createActionGroup({
  source: 'OverviewFeedback',
  events: {
    'Load feedback': emptyProps(),
    'Load feedback success': props<{ data: OverviewFeedback }>(),
    'Load feedback error': props<{ error: string }>(),
  },
});
