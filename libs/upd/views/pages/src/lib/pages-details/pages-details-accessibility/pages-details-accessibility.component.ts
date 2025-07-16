import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { I18nFacade } from '@dua-upd/upd/state';
import { PagesDetailsFacade } from '../+state/pages-details.facade';
import { toSignal } from '@angular/core/rxjs-interop';
import { ApiService } from '@dua-upd/upd/services';
import { catchError, finalize, filter, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

// Module-level cache that persists between component instances
const accessibilityCache = new Map<string, AccessibilityTestResponse>();

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
  private lastTestedUrl = '';
  
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
    // Automatically run accessibility test when page URL changes
    this.pageUrl$.pipe(
      filter(url => !!url),
      takeUntil(this.destroy$)
    ).subscribe((url) => {
      // Check if we have cached results for this URL
      const cached = accessibilityCache.get(url);
      if (cached) {
        // Use cached results
        this.testResults = cached;
        this.errorMessage = '';
        this.lastTestedUrl = url;
        // Re-compute chart data and metrics from cached results
        if (cached.data?.desktop?.audits) {
          this.desktopChartData = this.getAuditDistributionData(cached.data.desktop.audits);
          this.desktopMetrics = this.getAutomatedTestMetrics(cached.data.desktop.audits);
        }
        if (cached.data?.mobile?.audits) {
          this.mobileChartData = this.getAuditDistributionData(cached.data.mobile.audits);
          this.mobileMetrics = this.getAutomatedTestMetrics(cached.data.mobile.audits);
        }
        this.cdr.detectChanges();
      } else {
        // New URL or no cache, run the test
        this.lastTestedUrl = url;
        this.runAccessibilityTest();
      }
    });
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
    
    // Replace markdown links with HTML anchor tags
    const htmlDescription = description.replace(markdownLinkRegex, (_match, linkText, url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary">${linkText}</a>`;
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

    // Get the current language to pass to the API
    const currentLang = this.i18n.service.currentLang;
    const locale = currentLang === 'fr-CA' ? 'fr' : 'en';

    this.apiService
      .get<AccessibilityTestResponse>(`/api/pages/accessibility-test?url=${encodeURIComponent(url)}&locale=${locale}`)
      .pipe(
        catchError((error) => {
          console.error('Accessibility test error:', error);
          return of({
            success: false,
            error: error.message || 'Failed to run accessibility test'
          } as AccessibilityTestResponse);
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
            accessibilityCache.set(url, response);
          }
          // Pre-compute chart data and metrics to avoid recalculation on every change detection
          if (response.data?.desktop?.audits) {
            this.desktopChartData = this.getAuditDistributionData(response.data.desktop.audits);
            this.desktopMetrics = this.getAutomatedTestMetrics(response.data.desktop.audits);
          }
          if (response.data?.mobile?.audits) {
            this.mobileChartData = this.getAuditDistributionData(response.data.mobile.audits);
            this.mobileMetrics = this.getAutomatedTestMetrics(response.data.mobile.audits);
          }
          // Manually trigger change detection to ensure charts are updated
          this.cdr.detectChanges();
        } else {
          this.errorMessage = response.error || 'An error occurred during testing';
          this.desktopChartData = null;
          this.mobileChartData = null;
          this.desktopMetrics = null;
          this.mobileMetrics = null;
        }
      });
  }
}
