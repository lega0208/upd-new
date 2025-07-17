import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { I18nFacade } from '@dua-upd/upd/state';
import { PagesDetailsFacade } from '../+state/pages-details.facade';
import { toSignal } from '@angular/core/rxjs-interop';
import { ApiService } from '@dua-upd/upd/services';
import { catchError, finalize, filter, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

// Module-level cache that persists between component instances
// Cache structure: URL -> { en: results, fr: results }
const accessibilityCache = new Map<string, LocalizedAccessibilityTestResponse>();

interface LocalizedAccessibilityTestResponse {
  en?: AccessibilityTestResponse;
  fr?: AccessibilityTestResponse;
}

interface AccessibilityTestResponse {
  success: boolean;
  data?: {
    desktop: AccessibilityTestResult;
    mobile: AccessibilityTestResult;
  };
  error?: string;
}

interface AccessibilityTestResult {
  url: string;
  strategy: 'mobile' | 'desktop';
  score: number;
  scoreDisplay: string;
  audits: AccessibilityAudit[];
  testedAt: Date;
}

interface AccessibilityAudit {
  id: string;
  title: string;
  description: string;
  score: number | null;
  displayMode: string;
  category: 'failed' | 'manual_check' | 'passed' | 'not_applicable';
  snippet?: string;
  helpText?: string;
  selector?: string;
  impact?: string;
  tags?: string[];
}

@Component({
    selector: 'upd-pages-details-accessibility',
    templateUrl: './pages-details-accessibility.component.html',
    styleUrls: ['./pages-details-accessibility.component.css'],
    standalone: false
})
export class PagesDetailsAccessibilityComponent implements OnInit, OnDestroy {
  private i18n = inject(I18nFacade);
  private pageDetailsService = inject(PagesDetailsFacade);
  private apiService = inject(ApiService);
  private sanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  currentLang$ = this.i18n.currentLang$;
  pageUrl$ = this.pageDetailsService.pageUrl$;
  pageUrl = toSignal(this.pageUrl$);
  
  // State for accessibility testing
  isTestRunning = false;
  testResults: AccessibilityTestResponse | null = null;
  errorMessage = '';
  private _lastTestedUrl = '';
  
  // Computed data for charts (to avoid recalculation on every change detection)
  desktopChartData: { series: number[]; labels: string[] } | null = null;
  mobileChartData: { series: number[]; labels: string[] } | null = null;
  desktopMetrics: any = null;
  mobileMetrics: any = null;

  // Getter for mobile chart data to ensure proper change detection
  get mobileChartDataComputed() {
    if (this.testResults?.data?.mobile?.audits) {
      return this.getAuditDistributionData(this.testResults.data.mobile.audits);
    }
    return null;
  }

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

    // Automatically run accessibility test when page URL changes
    this.pageUrl$.pipe(
      filter(url => !!url),
      takeUntil(this.destroy$)
    ).subscribe((url) => {
      this.handleUrlChange(url);
    });
  }

  private handleUrlChange(url: string) {
    // Check if we have cached results for this URL
    const cachedData = accessibilityCache.get(url);
    const currentLang = this.i18n.service.currentLang;
    const langKey = currentLang === 'fr-CA' ? 'fr' : 'en';
    
    if (cachedData && cachedData[langKey]) {
      // Use cached results for the current language
      this.testResults = cachedData[langKey];
      this.errorMessage = '';
      this._lastTestedUrl = url;
      // Re-compute chart data and metrics from cached results
      if (cachedData[langKey].data?.desktop?.audits) {
        this.desktopChartData = this.getAuditDistributionData(cachedData[langKey].data.desktop.audits);
        this.desktopMetrics = this.getAutomatedTestMetrics(cachedData[langKey].data.desktop.audits);
      }
      if (cachedData[langKey].data?.mobile?.audits) {
        this.mobileChartData = this.getAuditDistributionData(cachedData[langKey].data.mobile.audits);
        this.mobileMetrics = this.getAutomatedTestMetrics(cachedData[langKey].data.mobile.audits);
      }
      this.cdr.detectChanges();
    } else {
      // New URL or no cache, run the test
      this._lastTestedUrl = url;
      this.runAccessibilityTest();
    }
  }

  private updateResultsForCurrentLanguage(url: string) {
    const cachedData = accessibilityCache.get(url);
    const currentLang = this.i18n.service.currentLang;
    const langKey = currentLang === 'fr-CA' ? 'fr' : 'en';
    
    if (cachedData && cachedData[langKey]) {
      // Update to show results in the new language
      this.testResults = cachedData[langKey];
      this.errorMessage = '';
      
      // Re-compute chart data and metrics for the new language
      if (cachedData[langKey].data?.desktop?.audits) {
        this.desktopChartData = this.getAuditDistributionData(cachedData[langKey].data.desktop.audits);
        this.desktopMetrics = this.getAutomatedTestMetrics(cachedData[langKey].data.desktop.audits);
      }
      if (cachedData[langKey].data?.mobile?.audits) {
        this.mobileChartData = this.getAuditDistributionData(cachedData[langKey].data.mobile.audits);
        this.mobileMetrics = this.getAutomatedTestMetrics(cachedData[langKey].data.mobile.audits);
      }
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // Helper function to categorize audits by type
  getCategorizedAudits(audits: AccessibilityAudit[]) {
    return {
      failed: audits.filter(audit => audit.category === 'failed'),
      passed: audits.filter(audit => audit.category === 'passed'),
      manual: audits.filter(audit => audit.category === 'manual_check'),
      notApplicable: audits.filter(audit => audit.category === 'not_applicable')
    };
  }

  // Helper function to generate donut chart data
  getAuditDistributionData(audits: AccessibilityAudit[]) {
    const categorized = this.getCategorizedAudits(audits);
    const series = [
      categorized.failed.length,
      categorized.passed.length,
      categorized.manual.length,
      categorized.notApplicable.length
    ];
    
    // Translation keys for chart labels
    const labelKeys = [
      'accessibility-failed-tests',
      'accessibility-passed-tests',
      'accessibility-manual-checks',
      'accessibility-not-applicable'
    ];
    
    // Only include categories that have values > 0
    const filteredData = series.reduce((acc, value, index) => {
      if (value > 0) {
        acc.series.push(value);
        // Use instant translation for immediate rendering
        acc.labels.push(this.i18n.service.instant(labelKeys[index]));
      }
      return acc;
    }, { series: [] as number[], labels: [] as string[] });
    
    // If all values are 0, return at least one item to prevent "no data" message
    if (filteredData.series.length === 0) {
      return {
        series: [1],
        labels: [this.i18n.service.instant('accessibility-no-data')]
      };
    }
    
    return filteredData;
  }

  // Helper function to calculate automated test metrics
  getAutomatedTestMetrics(audits: AccessibilityAudit[]) {
    const categorized = this.getCategorizedAudits(audits);
    const automatedTestable = categorized.failed.length + categorized.passed.length;
    const passRate = automatedTestable > 0 ? 
      Math.round((categorized.passed.length / automatedTestable) * 100) : 0;
    
    return {
      totalAutomated: automatedTestable,
      failed: categorized.failed.length,
      passed: categorized.passed.length,
      passRate,
      manualChecks: categorized.manual.length
    };
  }

  // TrackBy function for ngFor performance
  trackByAuditId(_index: number, audit: AccessibilityAudit): string {
    return audit.id;
  }

  // Get CSS class for score display
  getScoreClass(score: number): string {
    if (score >= 90) return 'text-success';
    if (score >= 50) return 'text-warning';
    return 'text-danger';
  }

  // Parse markdown-style links in description text
  parseMarkdownLinks(description: string): SafeHtml {
    // Regular expression to match markdown links: [text](url)
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    
    // Get current language
    const currentLang = this.i18n.service.currentLang;
    const isEnglish = currentLang === 'en-CA';
    
    // Replace markdown links with HTML anchor tags
    const htmlDescription = description.replace(markdownLinkRegex, (_match, linkText, url) => {
      // Add ?hl=fr to Chrome developer documentation URLs if user is on French page
      let processedUrl = url;
      if (!isEnglish && url.includes('https://developer.chrome.com/docs/lighthouse/accessibility')) {
        // Check if URL already has query parameters
        processedUrl = url.includes('?') ? `${url}&hl=fr` : `${url}?hl=fr`;
      }
      
      return `<a href="${processedUrl}" target="_blank" rel="noopener noreferrer" class="text-primary">${linkText}</a>`;
    });
    
    // Sanitize the HTML to prevent XSS attacks while allowing safe anchor tags
    return this.sanitizer.sanitize(1, htmlDescription) || description;
  }

  // Run accessibility test
  runAccessibilityTest() {
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
      .get<LocalizedAccessibilityTestResponse>(`/api/pages/accessibility-test?url=${encodeURIComponent(url)}`)
      .pipe(
        catchError((error) => {
          console.error('Accessibility test error:', error);
          const errorResponse = {
            success: false,
            error: error.message || 'Failed to run accessibility test'
          } as AccessibilityTestResponse;
          return of({
            en: errorResponse,
            fr: errorResponse
          } as LocalizedAccessibilityTestResponse);
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
            accessibilityCache.set(url, response);
          }
          
          // Use the current language results
          this.testResults = response[langKey];
          
          // Pre-compute chart data and metrics to avoid recalculation on every change detection
          if (response[langKey].data?.desktop?.audits) {
            this.desktopChartData = this.getAuditDistributionData(response[langKey].data.desktop.audits);
            this.desktopMetrics = this.getAutomatedTestMetrics(response[langKey].data.desktop.audits);
          }
          if (response[langKey].data?.mobile?.audits) {
            this.mobileChartData = this.getAuditDistributionData(response[langKey].data.mobile.audits);
            this.mobileMetrics = this.getAutomatedTestMetrics(response[langKey].data.mobile.audits);
          }
          // Manually trigger change detection to ensure charts are updated
          this.cdr.detectChanges();
        } else {
          const errorResponse = response && response[langKey];
          this.errorMessage = (errorResponse && errorResponse.error) || 'An error occurred during testing';
          this.desktopChartData = null;
          this.mobileChartData = null;
          this.desktopMetrics = null;
          this.mobileMetrics = null;
        }
      });
  }
}
