import { createReducer, on, Action } from '@ngrx/store';

import * as TasksDetailsActions from './tasks-details.actions';
import type { TaskDetailsData } from '@dua-upd/types-common';

export const TASKS_DETAILS_FEATURE_KEY = 'tasksDetails';

export interface TasksDetailsState {
  data: TaskDetailsData;
  loaded: boolean; // has the TasksDetails list been loaded
  loading: boolean; // is the TasksDetails list currently being loaded
  error?: string | null; // last known error (if any)
}

export interface TasksDetailsPartialState {
  readonly [TASKS_DETAILS_FEATURE_KEY]: TasksDetailsState;
}

export const tasksDetailsInitialState: TasksDetailsState = {
  // set initial required properties
  data: {
    _id: '',
    title: '',
    group: '',
    subgroup: '',
    topic: '',
    subtopic: '',
    sub_subtopic: [],
    user_type: [],
    program: '',
    service: '',
    user_journey: [],
    status: '',
    channel: [],
    core: [],
    dateRange: '',
    comparisonDateRange: '',
    avgTaskSuccessFromLastTest: 0,
    avgSuccessPercentChange: 0,
    dateFromLastTest: new Date(0),
    taskSuccessByUxTest: [],
    feedbackComments: [],
    projects: [],
    searchTerms: [],
  },
  loaded: false,
  loading: false,
  error: null,
};

const reducer = createReducer(
  tasksDetailsInitialState,
  on(
    TasksDetailsActions.loadTasksDetailsInit,
    (state): TasksDetailsState => ({
      ...state,
      loaded: false,
      loading: true,
      error: null,
    })
  ),
  on(
    TasksDetailsActions.loadTasksDetailsSuccess,
    (state, { data }): TasksDetailsState =>
      data === null
        ? {
            ...state,
            loaded: true,
            loading: false,
            error: null,
          }
        : {
            ...state,
            data: { ...data },
            loaded: true,
            loading: false,
            error: null,
          }
  ),
  on(
    TasksDetailsActions.loadTasksDetailsError,
    (state, { error }): TasksDetailsState => ({
      ...state,
      loaded: true,
      loading: false,
      error,
    })
  )
);

export function tasksDetailsReducer(
  state: TasksDetailsState | undefined,
  action: Action
) {
  return reducer(state, action);
}
