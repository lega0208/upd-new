import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, inject, ChangeDetectorRef } from '@angular/core';
import { ApiService } from '@dua-upd/upd/services';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';

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
  helpUrl?: string;
}

@Component({
    selector: 'upd-page-accessibility',
    templateUrl: './page-accessibility.component.html',
    styleUrls: ['./page-accessibility.component.scss'],
    standalone: false
})
export class PageAccessibilityComponent implements OnInit, OnDestroy, OnChanges {
  @Input() url: string | null = null;
  @Input() language: string = 'en-CA';

  private apiService = inject(ApiService);
  private sanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);
  private translateService = inject(TranslateService);
  private destroy$ = new Subject<void>();

  // State for accessibility testing
  isTestRunning = false;
  testResults: AccessibilityTestResponse | null = null;
  errorMessage = '';
  
  // Computed data for charts (to avoid recalculation on every change detection)
  desktopChartData: { series: number[]; labels: string[]; colors: string[] } | null = null;
  mobileChartData: { series: number[]; labels: string[]; colors: string[] } | null = null;
  desktopMetrics: { totalAutomated: number; failed: number; passed: number; passRate: number; manualChecks: number } | null = null;
  mobileMetrics: { totalAutomated: number; failed: number; passed: number; passRate: number; manualChecks: number } | null = null;

  // Mapping of API titles to translation keys for manual verification items
  private manualVerificationMapping: { [key: string]: string } = {
    'Interactive controls are keyboard focusable': 'accessibility-manual-interactive-control',
    'Interactive elements indicate their purpose and state': 'accessibility-manual-interactive-elements',
    'The page has a logical tab order': 'accessibility-manual-logical-tab',
    'Visual order on the page follows DOM order': 'accessibility-manual-dom-order',
    'User focus is not accidentally trapped in a region': 'accessibility-manual-focus-trap',
    'The user\'s focus is directed to new content added to the page': 'accessibility-manual-new-content',
    'HTML5 landmark elements are used to improve navigation': 'accessibility-manual-html5-landmark',
    'Offscreen content is hidden from assistive technology': 'accessibility-manual-offscreen-content',
    'Custom controls have associated labels': 'accessibility-manual-custom-control',
    'Custom controls have ARIA roles': 'accessibility-manual-aria-roles'
  };

  ngOnInit() {
    // If we have a URL on init, check cache or run test
    if (this.url) {
      this.handleUrlChange(this.url);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // Handle URL changes
    if (changes['url'] && !changes['url'].firstChange && changes['url'].currentValue) {
      this.handleUrlChange(changes['url'].currentValue);
    }

    // Handle language changes
    if (changes['language'] && !changes['language'].firstChange && this.url) {
      this.updateResultsForCurrentLanguage(this.url);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private handleUrlChange(url: string) {
    // Check if we have cached results for this URL
    const cachedData = accessibilityCache.get(url);
    const langKey = this.language === 'fr-CA' ? 'fr' : 'en';
    
    if (cachedData && cachedData[langKey]) {
      // Use cached results for the current language
      this.testResults = cachedData[langKey];
      this.errorMessage = '';
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
      this.runAccessibilityTest();
    }
  }

  private updateResultsForCurrentLanguage(url: string) {
    const cachedData = accessibilityCache.get(url);
    const langKey = this.language === 'fr-CA' ? 'fr' : 'en';
    
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

  // Helper function to categorize audits by type
  getCategorizedAudits(audits: AccessibilityAudit[]) {
    // Process manual verification items to use translated titles/descriptions
    const processedAudits = audits.map(audit => {
      if (audit.category === 'manual_check') {
        const translationKey = this.manualVerificationMapping[audit.title];
        if (translationKey) {
          return {
            ...audit,
            title: this.translateService.instant(translationKey),
            description: this.translateService.instant(`${translationKey}-description`)
          };
        }
      }
      return audit;
    });

    return {
      failed: processedAudits.filter(audit => audit.category === 'failed'),
      passed: processedAudits.filter(audit => audit.category === 'passed'),
      manual: processedAudits.filter(audit => audit.category === 'manual_check'),
      notApplicable: processedAudits.filter(audit => audit.category === 'not_applicable')
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
    
    // Define colors for each category
    const colors = [
      '#dc3545', // Red for failed tests
      '#28a745', // Green for passed tests
      '#fd7e14', // Orange for manual checks
      '#6c757d'  // Gray for not applicable
    ];
    
    // Only include categories that have values > 0
    const filteredData = series.reduce((acc, value, index) => {
      if (value > 0) {
        acc.series.push(value);
        // Use instant translation for immediate rendering
        acc.labels.push(this.translateService.instant(labelKeys[index]));
        acc.colors.push(colors[index]);
      }
      return acc;
    }, { series: [] as number[], labels: [] as string[], colors: [] as string[] });
    
    // If all values are 0, return at least one item to prevent "no data" message
    if (filteredData.series.length === 0) {
      return {
        series: [1],
        labels: [this.translateService.instant('accessibility-no-data')],
        colors: ['#6c757d'] // Gray for no data
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
    const isEnglish = this.language === 'en-CA';
    
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
    if (!this.url) {
      this.errorMessage = 'No URL available for testing';
      return;
    }

    this.isTestRunning = true;
    this.errorMessage = '';
    this.testResults = null;

    // API will fetch both English and French results
    this.apiService
      .get<LocalizedAccessibilityTestResponse>(`/api/pages/accessibility-test?url=${encodeURIComponent(this.url)}`)
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
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((response) => {
        const langKey = this.language === 'fr-CA' ? 'fr' : 'en';
        
        if (response && response[langKey] && response[langKey].success) {
          // Cache both language results
          if (this.url) {
            accessibilityCache.set(this.url, response);
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