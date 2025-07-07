# Accessibility Testing Feature Implementation

This document outlines all changes made to implement the on-demand accessibility testing feature using the PageSpeed Insights API.

## Overview

The accessibility testing feature allows users to test any page for WCAG 2.1 AA compliance directly from the page details view. It runs real-time tests using Google's PageSpeed Insights API and displays results for both desktop and mobile views.

## New Files Created

### 1. Component Files
**Path**: `/libs/upd/views/pages/src/lib/pages-details/pages-details-accessibility/`

- **pages-details-accessibility.component.ts**
  - Main component that handles the accessibility testing logic
  - Injects required services (ApiService, I18nFacade, PagesDetailsFacade)
  - Contains `runAccessibilityTest()` method that calls the backend API
  - Manages loading states and error handling
  - Defines TypeScript interfaces for the API response structure

- **pages-details-accessibility.component.html**
  - Template with "Run Accessibility Test" button
  - Shows loading spinner during test execution
  - Displays results in tabs (Desktop/Mobile)
  - Uses existing UPD components (upd-data-card, upd-card, p-tabView)
  - All text uses translation keys (no hardcoded strings)

- **pages-details-accessibility.component.css**
  - Empty file (using default styles from existing components)

### 2. Backend Service Files
**Path**: `/libs/external-data/src/lib/pagespeed-insights/`

- **pagespeed-insights.client.ts**
  - Low-level client that makes HTTP requests to Google's PageSpeed Insights API
  - Uses axios for HTTP calls
  - Handles API authentication using environment variable (PAGESPEED_API_KEY)
  - Defines TypeScript interfaces for API request/response

- **pagespeed-insights.service.ts**
  - Business logic layer for processing PageSpeed data
  - Implements retry logic with @Retry decorator
  - Categorizes accessibility audits (failed, manual_check, passed, not_applicable)
  - Provides methods for single strategy or both desktop/mobile testing
  - Extracts relevant data from complex API responses

### 3. API Endpoint
**Path**: `/apps/api/src/pages/`

- Added new method in **pages.controller.ts**:
  ```typescript
  @Get('accessibility-test')
  async runAccessibilityTest(@Query('url') url: string) {
    return this.pagesService.runAccessibilityTest(url);
  }
  ```

- Added new method in **pages.service.ts**:
  ```typescript
  async runAccessibilityTest(url: string) {
    try {
      const results = await this.pageSpeedInsightsService.runAccessibilityTestForBothStrategies(url);
      return {
        success: true,
        data: results,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to run accessibility test',
      };
    }
  }
  ```

## Updated Existing Files

### 1. Module Registration

**File**: `/libs/upd/views/pages/src/lib/pages.module.ts`
- Added imports:
  - `import { TabViewModule } from 'primeng/tabview';` (for the tab component)
  - Component import for PagesDetailsAccessibilityComponent
- Added to imports array: `TabViewModule`
- Added to declarations array: `PagesDetailsAccessibilityComponent`

### 2. Routing Configuration

**File**: `/libs/upd/views/pages/src/lib/pages-routing.module.ts`
- Added new route under pages/:id children:
  ```typescript
  {
    path: 'accessibility',
    component: PagesDetailsAccessibilityComponent,
  }
  ```

### 3. Navigation Tab

**File**: `/libs/upd/views/pages/src/lib/pages-details/pages-details.component.ts`
- Added 'accessibility' to the navTabs array after 'version-history'

### 4. Date Selector Logic

**File**: `/libs/upd/views/pages/src/lib/pages-details/pages-details.component.html`
- Updated the date selector condition to hide it on accessibility page:
  ```html
  *ngIf="
    !((currentRoute$ | async) || '').endsWith('readability') &&
    !((currentRoute$ | async) || '').endsWith('version-history') &&
    !((currentRoute$ | async) || '').endsWith('accessibility')
  "
  ```

### 5. Translations

**File**: `/libs/upd/i18n/src/lib/translations/en-CA.json`
- Added accessibility-related translations:
  ```json
  "tab-accessibility": "Accessibility",
  "accessibility.title": "Page Accessibility Testing",
  "accessibility.description": "Test this page for WCAG 2.1 AA compliance using automated accessibility checks.",
  "accessibility.run-test": "Run Accessibility Test",
  "accessibility.testing-url": "Testing page accessibility...",
  "accessibility.desktop": "Desktop",
  "accessibility.mobile": "Mobile",
  "accessibility.score": "Accessibility Score",
  "accessibility.score-tooltip": "Overall accessibility score based on WCAG 2.1 AA criteria",
  "accessibility.tested-at": "Tested At",
  "accessibility.tested-at-tooltip": "When this accessibility test was performed",
  "accessibility.desktop-results": "Desktop accessibility test results",
  "accessibility.mobile-results": "Mobile accessibility test results"
  ```

**File**: `/libs/upd/i18n/src/lib/translations/fr-CA.json`
- Added French translations for all the above keys

### 6. External Data Module

**File**: `/libs/external-data/src/lib/external-data.module.ts`
- Added imports for new services
- Added to providers array:
  - `PageSpeedInsightsService`
  - Provider configuration for `PageSpeedInsightsClient`
- Added to exports array:
  - `PageSpeedInsightsService`
  - `PageSpeedInsightsClient.name`

**File**: `/libs/external-data/src/index.ts`
- Added exports:
  ```typescript
  export * from './lib/pagespeed-insights/pagespeed-insights.service';
  export * from './lib/pagespeed-insights/pagespeed-insights.client';
  ```

### 7. Service Injection

**File**: `/apps/api/src/pages/pages.service.ts`
- Added import: `import { PageSpeedInsightsService } from '@dua-upd/external-data';`
- Added to constructor: `private pageSpeedInsightsService: PageSpeedInsightsService,`

## Architecture Decisions

### Why Backend Service?

The PageSpeed Insights API integration was implemented as a backend service rather than direct frontend calls for several important reasons:

1. **Security**: API keys should never be exposed in frontend code
2. **CORS**: Google's API may have CORS restrictions preventing direct browser calls
3. **Consistency**: Follows the existing pattern in the codebase where all external APIs (Adobe Analytics, Google Search Console, Airtable) are accessed through backend services
4. **Rate Limiting**: Backend can implement caching and rate limiting to avoid API quota issues
5. **Data Processing**: Backend can process and normalize the complex API response before sending to frontend

### Component Structure

The accessibility component was created by copying the `pages-details-versions` component structure to maintain consistency with existing patterns in the codebase. This ensures:
- Familiar code organization for the team
- Consistent styling and behavior
- Reuse of existing state management patterns

### UI Components

The implementation uses existing UPD components:
- `upd-data-card`: For displaying the accessibility score
- `upd-card`: For displaying the test timestamp
- `p-tabView/p-tabPanel`: For Desktop/Mobile tabs (from PrimeNG)

This ensures visual consistency with the rest of the application and reduces the need for custom styling.

## Testing the Feature

1. Navigate to any page in the Pages section
2. Click on the "Accessibility" tab
3. Click "Run Accessibility Test"
4. Wait for results (tests both desktop and mobile views)
5. View scores and switch between Desktop/Mobile tabs

## Future Enhancements

The current implementation provides basic functionality. Future enhancements could include:
- Detailed audit results display (the data is already being fetched)
- Visual charts showing distribution of passed/failed/manual checks
- Export functionality for accessibility reports
- Historical tracking of accessibility scores over time
- Scheduled automated testing

## Environment Configuration

The feature requires a PageSpeed Insights API key to be set in the environment:
```
PAGESPEED_API_KEY=your_api_key_here
```

This should be added to the `.env` file in production environments.