import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { I18nFacade } from '@dua-upd/upd/state';
import { PagesDetailsFacade } from '../+state/pages-details.facade';
import { toSignal } from '@angular/core/rxjs-interop';
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
  private translateService = inject(TranslateService);
  private destroy$ = new Subject<void>();

  currentLang$ = this.i18n.currentLang$;
  pageUrl$ = this.pageDetailsService.pageUrl$;
  
  // Convert observables to signals for template use
  currentLang = toSignal(this.currentLang$);
  url = toSignal(this.pageUrl$);

  // State for accessibility testing
  isTestRunning = false;
  testResults: AccessibilityTestResponse | null = null;
  errorMessage = '';
  mobileTabViewed = false;
  
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
    // Subscribe to URL changes
    this.pageUrl$.pipe(takeUntil(this.destroy$)).subscribe(url => {
      if (url) {
        this.handleUrlChange(url);
      }
    });

    // Subscribe to language changes
    this.currentLang$.pipe(takeUntil(this.destroy$)).subscribe(lang => {
      if (this.url() && this.testResults) {
        this.updateResultsForCurrentLanguage(this.url()!);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private handleUrlChange(url: string) {
    // Check if we have cached results for this URL
    const cachedData = accessibilityCache.get(url);
    const langKey = this.currentLang() === 'fr-CA' ? 'fr' : 'en';
    
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
      // Force a second change detection cycle for ApexCharts initialization
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 100);
    } else {
      // New URL or no cache, run the test
      this.runAccessibilityTest();
    }
  }

  private updateResultsForCurrentLanguage(url: string) {
    const cachedData = accessibilityCache.get(url);
    const langKey = this.currentLang() === 'fr-CA' ? 'fr' : 'en';
    
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
      // Force a second change detection cycle for ApexCharts initialization
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 100);
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
    // Score is in decimal format (0-1), so 0.5 = 50%
    if (score > 0.5) return 'text-success';
    return 'text-danger';
  }

  // Get Deque University URL with language parameter for French
  getDequeUrl(audit: AccessibilityAudit): string {
    const baseUrl = audit.helpUrl || `https://dequeuniversity.com/rules/axe/latest/${audit.id}`;
    // Add language parameter for French users
    if (this.currentLang() === 'fr-CA') {
      return baseUrl.includes('?') ? `${baseUrl}&lang=fr` : `${baseUrl}?lang=fr`;
    }
    return baseUrl;
  }

  // Parse markdown-style links in description text
  parseMarkdownLinks(description: string): SafeHtml {
    // Regular expression to match markdown links: [text](url)
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    
    // Get current language
    const isEnglish = this.currentLang() === 'en-CA';
    
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

  // Handle tab change to ensure charts render properly
  onTabChange(event: any) {
    // Check if switching to mobile tab for the first time
    if (event.index === 1 && !this.mobileTabViewed) {
      this.mobileTabViewed = true;
      // Force re-render of mobile chart data
      const tempData = this.mobileChartData;
      this.mobileChartData = null;
      this.cdr.detectChanges();
      
      setTimeout(() => {
        this.mobileChartData = tempData;
        this.cdr.detectChanges();
      }, 100);
    }
  }

  // Run accessibility test
  runAccessibilityTest() {
    const currentUrl = this.url();
    if (!currentUrl) {
      this.errorMessage = this.translateService.instant('accessibility-error-no-url');
      return;
    }

    this.isTestRunning = true;
    this.errorMessage = '';
    this.testResults = null;

    // API will fetch both English and French results
    this.apiService
      .get<LocalizedAccessibilityTestResponse>(`/api/pages/accessibility-test?url=${encodeURIComponent(currentUrl)}`)
      .pipe(
        catchError((error) => {
          console.error('Accessibility test error:', error);
          
          // Map common error types to translation keys
          let errorKey = 'accessibility-error-generic';
          if (error.status === 429) {
            errorKey = 'accessibility-error-rate-limit';
          } else if (error.status === 0 || error.name === 'NetworkError') {
            errorKey = 'accessibility-error-network';
          } else if (error.status === 400 && error.error?.message?.includes('Invalid URL')) {
            errorKey = 'accessibility-error-invalid-url';
          } else if (error.name === 'TimeoutError' || error.status === 504) {
            errorKey = 'accessibility-error-timeout';
          }
          
          // For API errors, we'll return the error key and let the component translate it
          // based on the current language when displaying
          const errorResponse = {
            success: false,
            error: errorKey // Store the key, not the translated message
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
        const langKey = this.currentLang() === 'fr-CA' ? 'fr' : 'en';
        
        if (response && response[langKey] && response[langKey].success) {
          // Cache both language results
          if (currentUrl) {
            accessibilityCache.set(currentUrl, response);
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
          // Force a second change detection cycle for ApexCharts initialization
          setTimeout(() => {
            this.cdr.detectChanges();
          }, 100);
        } else {
          const errorResponse = response && response[langKey];
          if (errorResponse && errorResponse.error) {
            // Check if error is a translation key (starts with 'accessibility-error-')
            if (errorResponse.error.startsWith('accessibility-error-')) {
              this.errorMessage = this.translateService.instant(errorResponse.error);
            } else {
              // For other errors, use as-is or fallback to generic
              this.errorMessage = errorResponse.error || this.translateService.instant('accessibility-error-generic');
            }
          } else {
            this.errorMessage = this.translateService.instant('accessibility-error-generic');
          }
          this.desktopChartData = null;
          this.mobileChartData = null;
          this.desktopMetrics = null;
          this.mobileMetrics = null;
        }
      });
  }
}