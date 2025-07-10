import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { I18nFacade } from '@dua-upd/upd/state';
import { PagesDetailsFacade } from '../+state/pages-details.facade';
import { toSignal } from '@angular/core/rxjs-interop';
import { ApiService } from '@dua-upd/upd/services';
import { catchError, finalize, filter, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';

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
  private destroy$ = new Subject<void>();

  currentLang$ = this.i18n.currentLang$;
  pageUrl$ = this.pageDetailsService.pageUrl$;
  pageUrl = toSignal(this.pageUrl$);
  
  // State for accessibility testing
  isTestRunning = false;
  testResults: AccessibilityTestResponse | null = null;
  errorMessage = '';
  
  // Computed data for charts (to avoid recalculation on every change detection)
  desktopChartData: { series: number[]; labels: string[] } | null = null;
  mobileChartData: { series: number[]; labels: string[] } | null = null;
  desktopMetrics: any = null;
  mobileMetrics: any = null;

  ngOnInit() {
    // Automatically run accessibility test when page URL changes
    this.pageUrl$.pipe(
      filter(url => !!url),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.runAccessibilityTest();
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
    
    // Only include categories that have values > 0
    const filteredData = series.reduce((acc, value, index) => {
      if (value > 0) {
        acc.series.push(value);
        acc.labels.push(['Failed', 'Passed', 'Manual Check', 'Not Applicable'][index]);
      }
      return acc;
    }, { series: [] as number[], labels: [] as string[] });
    
    // If all values are 0, return at least one item to prevent "no data" message
    if (filteredData.series.length === 0) {
      return {
        series: [1],
        labels: ['No audits available']
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

    this.apiService
      .get<AccessibilityTestResponse>(`/api/pages/accessibility-test?url=${encodeURIComponent(url)}`)
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
          // Pre-compute chart data and metrics to avoid recalculation on every change detection
          if (response.data?.desktop?.audits) {
            this.desktopChartData = this.getAuditDistributionData(response.data.desktop.audits);
            this.desktopMetrics = this.getAutomatedTestMetrics(response.data.desktop.audits);
          }
          if (response.data?.mobile?.audits) {
            this.mobileChartData = this.getAuditDistributionData(response.data.mobile.audits);
            this.mobileMetrics = this.getAutomatedTestMetrics(response.data.mobile.audits);
          }
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
