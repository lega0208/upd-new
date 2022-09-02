import {
  PagesHomePartialState,
  pagesHomeInitialState,
} from './pages-home.reducer';
import * as PagesHomeSelectors from './pages-home.selectors';

describe('PagesHome Selectors', () => {
  let state: PagesHomePartialState;

  beforeEach(() => {
    state = {
      pagesHome: pagesHomeInitialState
    };
  });

  describe('PagesHome Selectors', () => {
    expect(state).toBeDefined();
  });
});
