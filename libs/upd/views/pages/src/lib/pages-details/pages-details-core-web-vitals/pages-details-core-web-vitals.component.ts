import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { I18nFacade } from '@dua-upd/upd/state';
import { PagesDetailsFacade } from '../+state/pages-details.facade';
import { toSignal } from '@angular/core/rxjs-interop';
import { ApiService } from '@dua-upd/upd/services';
import { catchError, finalize, filter, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';

// Module-level cache that persists between component instances
// Cache structure: URL -> { en: results, fr: results }
const coreWebVitalsCache = new Map<string, LocalizedCoreWebVitalsTestResponse>();

interface LocalizedCoreWebVitalsTestResponse {
  en?: CoreWebVitalsTestResponse;
  fr?: CoreWebVitalsTestResponse;
}

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
    // Subscribe to language changes
    this.currentLang$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      // When language changes, update the displayed results if we have cached data
      const url = this.pageUrl();
      if (url && this.testResults) {
        this.updateResultsForCurrentLanguage(url);
      }
    });

    // Automatically run Core Web Vitals test when page URL changes
    this.pageUrl$.pipe(
      filter(url => !!url),
      takeUntil(this.destroy$)
    ).subscribe((url) => {
      this.handleUrlChange(url);
    });
  }

  private handleUrlChange(url: string) {
    // Check if we have cached results for this URL
    const cachedData = coreWebVitalsCache.get(url);
    const currentLang = this.i18n.service.currentLang;
    const langKey = currentLang === 'fr-CA' ? 'fr' : 'en';
    
    if (cachedData && cachedData[langKey]) {
      // Use cached results for the current language
      this.testResults = cachedData[langKey];
      this.errorMessage = '';
      this.lastTestedUrl = url;
      this.cdr.detectChanges();
    } else {
      // New URL or no cache, run the test
      this.lastTestedUrl = url;
      this.runCoreWebVitalsTest();
    }
  }

  private updateResultsForCurrentLanguage(url: string) {
    const cachedData = coreWebVitalsCache.get(url);
    const currentLang = this.i18n.service.currentLang;
    const langKey = currentLang === 'fr-CA' ? 'fr' : 'en';
    
    if (cachedData && cachedData[langKey]) {
      // Update to show results in the new language
      this.testResults = cachedData[langKey];
      this.errorMessage = '';
      this.cdr.detectChanges();
    }
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
      return { 
        icon: 'pi pi-check-circle', 
        class: 'text-success', 
        text: this.i18n.service.instant('core-web-vitals-status-good') 
      };
    } else if (score >= 0.5) {
      return { 
        icon: 'pi pi-exclamation-triangle', 
        class: 'text-warning', 
        text: this.i18n.service.instant('core-web-vitals-status-needs-improvement') 
      };
    } else {
      return { 
        icon: 'pi pi-times-circle', 
        class: 'text-danger', 
        text: this.i18n.service.instant('core-web-vitals-status-poor') 
      };
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

    // API will fetch both English and French results
    this.apiService
      .get<LocalizedCoreWebVitalsTestResponse>(`/api/pages/core-web-vitals?url=${encodeURIComponent(url)}`)
      .pipe(
        catchError((error) => {
          console.error('Core Web Vitals test error:', error);
          const errorResponse = {
            success: false,
            error: error.message || 'Failed to run Core Web Vitals test'
          } as CoreWebVitalsTestResponse;
          return of({
            en: errorResponse,
            fr: errorResponse
          } as LocalizedCoreWebVitalsTestResponse);
        }),
        finalize(() => {
          this.isTestRunning = false;
        })
      )
      .subscribe((response) => {
        const currentLang = this.i18n.service.currentLang;
        const langKey = currentLang === 'fr-CA' ? 'fr' : 'en';
        
        if (response && response[langKey] && response[langKey].success) {
          // Cache both language results
          if (url) {
            coreWebVitalsCache.set(url, response);
          }
          
          // Use the current language results
          this.testResults = response[langKey];
          
          // Manually trigger change detection to ensure UI updates
          this.cdr.detectChanges();
        } else {
          const errorResponse = response && response[langKey];
          this.errorMessage = (errorResponse && errorResponse.error) || 'An error occurred during testing';
        }
      });
  }
}