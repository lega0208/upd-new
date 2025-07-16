import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { I18nFacade } from '@dua-upd/upd/state';
import { PagesDetailsFacade } from '../+state/pages-details.facade';
import { toSignal } from '@angular/core/rxjs-interop';
import { ApiService } from '@dua-upd/upd/services';
import { catchError, finalize, filter, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';

// Module-level cache that persists between component instances
const coreWebVitalsCache = new Map<string, CoreWebVitalsTestResponse>();

interface CoreWebVitalsTestResponse {
  success: boolean;
  data?: {
    desktop: CoreWebVitalsTestResult;
    mobile: CoreWebVitalsTestResult;
  };
  error?: string;
}

interface CoreWebVitalsTestResult {
  url: string;
  strategy: 'mobile' | 'desktop';
  performanceScore: number | null;
  coreWebVitals: CoreWebVitals;
  testedAt: Date;
}

interface CoreWebVitals {
  lcp?: WebVitalMetric;
  fid?: WebVitalMetric;
  cls?: WebVitalMetric;
  inp?: WebVitalMetric;
  fcp?: WebVitalMetric;
  si?: WebVitalMetric;
  tti?: WebVitalMetric;
  tbt?: WebVitalMetric;
}

interface WebVitalMetric {
  name: string;
  value: string;
  score: number;
  numericValue: number;
  description?: string;
}

@Component({
    selector: 'upd-pages-details-core-web-vitals',
    templateUrl: './pages-details-core-web-vitals.component.html',
    styleUrls: ['./pages-details-core-web-vitals.component.css'],
    standalone: false
})
export class PagesDetailsCoreWebVitalsComponent implements OnInit, OnDestroy {
  private i18n = inject(I18nFacade);
  private pageDetailsService = inject(PagesDetailsFacade);
  private apiService = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  currentLang$ = this.i18n.currentLang$;
  pageUrl$ = this.pageDetailsService.pageUrl$;
  pageUrl = toSignal(this.pageUrl$);
  
  // State for Core Web Vitals testing
  isTestRunning = false;
  testResults: CoreWebVitalsTestResponse | null = null;
  errorMessage = '';
  private lastTestedUrl = '';

  ngOnInit() {
    // Automatically run Core Web Vitals test when page URL changes
    this.pageUrl$.pipe(
      filter(url => !!url),
      takeUntil(this.destroy$)
    ).subscribe((url) => {
      // Check if we have cached results for this URL
      const cached = coreWebVitalsCache.get(url);
      if (cached) {
        // Use cached results
        this.testResults = cached;
        this.errorMessage = '';
        this.lastTestedUrl = url;
        this.cdr.detectChanges();
      } else {
        // New URL or no cache, run the test
        this.lastTestedUrl = url;
        this.runCoreWebVitalsTest();
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // TrackBy function for ngFor performance
  trackByIndex(index: number): number {
    return index;
  }

  // KPI objective criteria for performance score
  performanceKpiObjectiveCriteria = (score: number): 'pass' | 'fail' => {
    // Good performance is 90% or above, failing is below 50%
    return score >= 0.5 ? 'pass' : 'fail';
  };

  // Get CSS class for score display
  getScoreClass(score: number): string {
    if (score >= 90) return 'text-success';
    if (score >= 50) return 'text-warning';
    return 'text-danger';
  }

  // Get status indicator for Core Web Vitals
  getVitalStatus(score: number): { icon: string; class: string; text: string } {
    if (score >= 0.9) {
      return { icon: 'pi pi-check-circle', class: 'text-success', text: 'Good' };
    } else if (score >= 0.5) {
      return { icon: 'pi pi-exclamation-triangle', class: 'text-warning', text: 'Needs Improvement' };
    } else {
      return { icon: 'pi pi-times-circle', class: 'text-danger', text: 'Poor' };
    }
  }

  // Get threshold info for Core Web Vitals metrics
  getVitalThresholds(key: string): string {
    switch (key) {
      case 'lcp':
        return 'Good < 2.5s | Needs Improvement 2.5s-4s | Poor > 4s';
      case 'fid':
        return 'Good < 100ms | Needs Improvement 100ms-300ms | Poor > 300ms';
      case 'cls':
        return 'Good < 0.1 | Needs Improvement 0.1-0.25 | Poor > 0.25';
      case 'inp':
        return 'Good < 200ms | Needs Improvement 200ms-500ms | Poor > 500ms';
      default:
        return '';
    }
  }

  // Run Core Web Vitals test
  runCoreWebVitalsTest() {
    const url = this.pageUrl();
    if (!url) {
      this.errorMessage = 'No URL available for testing';
      return;
    }

    this.isTestRunning = true;
    this.errorMessage = '';
    this.testResults = null;

    // Get the current language to pass to the API
    const currentLang = this.i18n.service.currentLang;
    const locale = currentLang === 'fr-CA' ? 'fr' : 'en';

    this.apiService
      .get<CoreWebVitalsTestResponse>(`/api/pages/core-web-vitals?url=${encodeURIComponent(url)}&locale=${locale}`)
      .pipe(
        catchError((error) => {
          console.error('Core Web Vitals test error:', error);
          return of({
            success: false,
            error: error.message || 'Failed to run Core Web Vitals test'
          } as CoreWebVitalsTestResponse);
        }),
        finalize(() => {
          this.isTestRunning = false;
        })
      )
      .subscribe((response) => {
        if (response.success) {
          this.testResults = response;
          // Cache the successful results
          if (url) {
            coreWebVitalsCache.set(url, response);
          }
          // Manually trigger change detection to ensure UI updates
          this.cdr.detectChanges();
        } else {
          this.errorMessage = response.error || 'An error occurred during testing';
        }
      });
  }
}