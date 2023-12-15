import { TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Store } from '@ngrx/store';

import {
  OverviewState,
  initialState,
} from './overview.reducer';
import * as OverviewSelectors from './overview.selectors';
import { selectOverviewState } from './overview.selectors';

describe('Overview Selectors', () => {
  let mockStore: MockStore<OverviewState>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideMockStore({
          initialState,
          selectors: [
            { selector: selectOverviewState, value: [{
              data: {
                dateRange: '',
                comparisonDateRange: '',
                tasksTestedSince2018: 0,
                testsConductedLastQuarter: 0,
                testsConductedLastFiscal: 0,
                copsTestsCompletedSince2018: 0,
                participantsTestedSince2018: 0,
                testsCompletedSince2018: 0,
                top25CalldriverTopics: [],
                top5IncreasedCalldriverTopics: [],
                top5DecreasedCalldriverTopics: [],
              },
              loaded: false,
              loading: false,
              error: null,
            }]},
            { selector: OverviewSelectors.selectOverviewData, value: [
              { topic: `PRODUCT-BBB.topic` },
            ]},
            { selector: OverviewSelectors.selectOverviewLoading, value:[{
              loading: true,
            }]},
            { selector: OverviewSelectors.selectOverviewLoaded, value:[{
              loaded: true,
            }]},
            { selector: OverviewSelectors.selectOverviewError, value:[{
              error: 'Load error',
            }]},
          ],
        }),
      ],
    });

    mockStore = TestBed.get(Store);

    // Define the properties for the projector Fn
    const resultOverrideSelectOverviewData = mockStore.overrideSelector(OverviewSelectors.selectOverviewData, {
      dateRange: '',
      comparisonDateRange: '',
      tasksTestedSince2018: 0,
      testsConductedLastQuarter: 0,
      testsConductedLastFiscal: 0,
      copsTestsCompletedSince2018: 0,
      participantsTestedSince2018: 0,
      testsCompletedSince2018: 0,
      top25CalldriverTopics: [
        { topic: `PRODUCT-AAA`,
        change: 0,
        tpc_id: '',
        subtopic: '',
        sub_subtopic: '',
        calls: 0
        },
        { topic: `PRODUCT-BBB`,
        change: 0,
        tpc_id: '',
        subtopic: '',
        sub_subtopic: '',
        calls: 0 },
        { topic: `PRODUCT-CCC`,
        change: 0,
        tpc_id: '',
        subtopic: '',
        sub_subtopic: '',
        calls: 0 },
      ],
      top5IncreasedCalldriverTopics: [],
      top5DecreasedCalldriverTopics: [],
    });

    const overrideSelectOverviewLoading = mockStore.overrideSelector(OverviewSelectors.selectOverviewLoading, true);

    const overrideSelectOverviewLoaded = mockStore.overrideSelector(OverviewSelectors.selectOverviewLoaded, true);

    const overrideSelectOverviewError = mockStore.overrideSelector(OverviewSelectors.selectOverviewError, 'Load error');

  });

  it('getAllOverview() should return the list of Overview', () => {
    const results = OverviewSelectors.selectOverviewData({});

    expect(results.top25CalldriverTopics.length).toBe(3);
    // console.log(Object.entries(results));
    // console.log(Object.entries(results)[8][1]);
    expect(results.top25CalldriverTopics[1].topic).toBe(`PRODUCT-BBB`);
  });

  it('OverviewData should return the selected Entity', () => {
    const results = OverviewSelectors.selectOverviewData({
      data: {
        dateRange: '',
        comparisonDateRange: '',
        tasksTestedSince2018: 0,
        testsConductedLastQuarter: 0,
        testsConductedLastFiscal: 0,
        copsTestsCompletedSince2018: 0,
        participantsTestedSince2018: 0,
        testsCompletedSince2018: 0,
        top25CalldriverTopics: [
          { 'PRODUCT-AAA': String },
          { 'PRODUCT-BBB': String },
          { 'PRODUCT-CCC': String },
        ],
        top5IncreasedCalldriverTopics: [],
        top5DecreasedCalldriverTopics: [],
      },
      loaded: false,
      loading: false,
      error: null,
    });

    expect(results.top25CalldriverTopics.length).toBe(3);
    // console.log(results.top25CalldriverTopics[1].topic);
    expect(results.top25CalldriverTopics[1].topic).toBe('PRODUCT-BBB');
  });

  it('getOverviewLoaded() should return the current "loading" status', () => {
    const result = OverviewSelectors.selectOverviewLoading({});

    // console.log('Loading result = ' + result);
    expect(result).toBe(true);
  });

  it('getOverviewLoaded() should return the current "loaded" status', () => {
    const result = OverviewSelectors.selectOverviewLoaded({});

    // console.log('Loaded result = ' + result);
    expect(result).toBe(true);
  });

  it('getOverviewError() should return the current "error" state', () => {
    const result = OverviewSelectors.selectOverviewError({});

    // console.log('Load error result = ' + result);
    expect(result).toBe('Load error');
  });
});
