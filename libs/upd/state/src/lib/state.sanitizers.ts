import { Action } from '@ngrx/store';
import { OverviewData, PagesHomeData } from '@dua-upd/types-common';

interface PagesHomeAction extends Action {
  data: PagesHomeData;
}

interface OverviewAction extends Action {
  data: OverviewData;
}

type State = { overview: { data: OverviewData }; pagesHome: { data: unknown } };

export const actionSanitizer = (action: Action) => {
  if (action.type === '[PagesHome/API] Load PagesHome Success') {
    return (action as PagesHomeAction).data
      ? { ...action, data: '<<LONG_BLOB>>' }
      : action;
  }

  if (action.type === '[Overview/API] Load Overview Success') {
    const data = (action as OverviewAction).data;

    return data?.dateRangeData
      ? {
          ...action,
          data: {
            ...data,
            dateRangeData: {
              ...data.dateRangeData,
              gcTasksComments: '<<OVERVIEW_GC_TASK_COMMENTS>>',
              feedbackPages: '<<OVERVIEW_FEEDBACK_PAGES>>',
            },
            comparisonDateRangeData: {
              ...data.comparisonDateRangeData,
              gcTasksComments: '<<OVERVIEW_GC_TASK_COMMENTS>>',
              feedbackPages: '<<OVERVIEW_FEEDBACK_PAGES>>',
            },
          },
        }
      : action;
  }

  return action;
};

export const stateSanitizer = (state: State) => {
  if (state?.pagesHome?.data || state?.overview?.data) {
    const pagesHome = state.pagesHome?.data
      ? {
          pagesHome: {
            ...state.pagesHome,
            data: '<<PAGES-HOME_DATA>>',
          },
        }
      : {};

    const overview = state.overview?.data
      ? {
          overview: {
            ...state.overview,
            data: {
              ...state.overview.data,
              dateRangeData: {
                ...state.overview.data.dateRangeData,
                feedbackPages: '<<OVERVIEW_FEEDBACK_PAGES>>',
                gcTasksComments: '<<OVERVIEW_GC_TASK_COMMENTS>>',
              },
              comparisonDateRangeData: {
                ...state.overview.data.comparisonDateRangeData,
                feedbackPages: '<<OVERVIEW_FEEDBACK_PAGES>>',
                gcTasksComments: '<<OVERVIEW_GC_TASK_COMMENTS>>',
              },
            },
          },
        }
      : {};

    return {
      ...state,
      ...overview,
      ...pagesHome,
    };
  }

  return state;
};
