import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { I18nFacade } from '@dua-upd/upd/state';
import { PagesDetailsFacade } from '../+state/pages-details.facade';
import { toSignal } from '@angular/core/rxjs-interop';
import { ApiService } from '@dua-upd/upd/services';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';

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
  currentLang = toSignal(this.currentLang$);
  url = toSignal(this.pageUrl$);

  isTestRunning = false;
  testResults: AccessibilityTestResponse | null = null;
  errorMessage = '';
  mobileTabViewed = false;
  desktopChartData: { series: number[]; labels: string[]; colors: string[] } | null = null;
  mobileChartData: { series: number[]; labels: string[]; colors: string[] } | null = null;
  desktopMetrics: { totalAutomated: number; failed: number; passed: number; passRate: number; manualChecks: number } | null = null;
  mobileMetrics: { totalAutomated: number; failed: number; passed: number; passRate: number; manualChecks: number } | null = null;

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
    this.pageUrl$.pipe(takeUntil(this.destroy$)).subscribe(url => {
      if (url) {
        this.handleUrlChange(url);
      }
    });

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
    const cachedData = accessibilityCache.get(url);
    const langKey = this.currentLang() === 'fr-CA' ? 'fr' : 'en';
    
    if (cachedData && cachedData[langKey]) {
      this.testResults = cachedData[langKey];
      this.errorMessage = '';
      if (cachedData[langKey].data?.desktop?.audits) {
        this.desktopChartData = this.getAuditDistributionData(cachedData[langKey].data.desktop.audits);
        this.desktopMetrics = this.getAutomatedTestMetrics(cachedData[langKey].data.desktop.audits);
      }
      if (cachedData[langKey].data?.mobile?.audits) {
        this.mobileChartData = this.getAuditDistributionData(cachedData[langKey].data.mobile.audits);
        this.mobileMetrics = this.getAutomatedTestMetrics(cachedData[langKey].data.mobile.audits);
      }
      this.cdr.detectChanges();
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 100);
    } else {
      this.runAccessibilityTest();
    }
  }

  private updateResultsForCurrentLanguage(url: string) {
    const cachedData = accessibilityCache.get(url);
    const langKey = this.currentLang() === 'fr-CA' ? 'fr' : 'en';
    
    if (cachedData && cachedData[langKey]) {
      this.testResults = cachedData[langKey];
      this.errorMessage = '';
      
      if (cachedData[langKey].data?.desktop?.audits) {
        this.desktopChartData = this.getAuditDistributionData(cachedData[langKey].data.desktop.audits);
        this.desktopMetrics = this.getAutomatedTestMetrics(cachedData[langKey].data.desktop.audits);
      }
      if (cachedData[langKey].data?.mobile?.audits) {
        this.mobileChartData = this.getAuditDistributionData(cachedData[langKey].data.mobile.audits);
        this.mobileMetrics = this.getAutomatedTestMetrics(cachedData[langKey].data.mobile.audits);
      }
      this.cdr.detectChanges();
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 100);
    }
  }

  getCategorizedAudits(audits: AccessibilityAudit[]) {
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

  getAuditDistributionData(audits: AccessibilityAudit[]) {
    const categorized = this.getCategorizedAudits(audits);
    const series = [
      categorized.failed.length,
      categorized.passed.length,
      categorized.manual.length,
      categorized.notApplicable.length
    ];
    
    const labelKeys = [
      'accessibility-failed-tests',
      'accessibility-passed-tests',
      'accessibility-manual-checks',
      'accessibility-not-applicable'
    ];
    
    const colors = [
      '#dc3545',
      '#28a745',
      '#fd7e14',
      '#6c757d'
    ];
    
    const filteredData = series.reduce((acc, value, index) => {
      if (value > 0) {
        acc.series.push(value);
        acc.labels.push(this.translateService.instant(labelKeys[index]));
        acc.colors.push(colors[index]);
      }
      return acc;
    }, { series: [] as number[], labels: [] as string[], colors: [] as string[] });
    
    if (filteredData.series.length === 0) {
      return {
        series: [1],
        labels: [this.translateService.instant('accessibility-no-data')],
        colors: ['#6c757d']
      };
    }
    
    return filteredData;
  }

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

  trackByAuditId(_index: number, audit: AccessibilityAudit): string {
    return audit.id;
  }

  getScoreClass(score: number): string {
    if (score > 0.5) return 'text-success';
    return 'text-danger';
  }

  getDequeUrl(audit: AccessibilityAudit): string {
    const baseUrl = audit.helpUrl || `https://dequeuniversity.com/rules/axe/latest/${audit.id}`;
    if (this.currentLang() === 'fr-CA') {
      return baseUrl.includes('?') ? `${baseUrl}&lang=fr` : `${baseUrl}?lang=fr`;
    }
    return baseUrl;
  }

  parseMarkdownLinks(description: string): SafeHtml {
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    
    const isEnglish = this.currentLang() === 'en-CA';
    
    const htmlDescription = description.replace(markdownLinkRegex, (_match, linkText, url) => {
      let processedUrl = url;
      if (!isEnglish && url.includes('https://developer.chrome.com/docs/lighthouse/accessibility')) {
        processedUrl = url.includes('?') ? `${url}&hl=fr` : `${url}?hl=fr`;
      }
      
      return `<a href="${processedUrl}" target="_blank" rel="noopener noreferrer" class="text-primary">${linkText}</a>`;
    });
    
    return this.sanitizer.sanitize(1, htmlDescription) || description;
  }

  onTabChange(event: any) {
    if (event.index === 1 && !this.mobileTabViewed) {
      this.mobileTabViewed = true;
      const tempData = this.mobileChartData;
      this.mobileChartData = null;
      this.cdr.detectChanges();
      
      setTimeout(() => {
        this.mobileChartData = tempData;
        this.cdr.detectChanges();
      }, 100);
    }
  }

  runAccessibilityTest() {
    const currentUrl = this.url();
    if (!currentUrl) {
      this.errorMessage = this.translateService.instant('accessibility-error-no-url');
      return;
    }

    this.isTestRunning = true;
    this.errorMessage = '';
    this.testResults = null;

    this.apiService
      .get<LocalizedAccessibilityTestResponse>(`/api/pages/accessibility-test?url=${encodeURIComponent(currentUrl)}`)
      .pipe(
        catchError((error) => {
          console.error('Accessibility test error:', error);
          
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
          
          const errorResponse = {
            success: false,
            error: errorKey
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
          if (currentUrl) {
            accessibilityCache.set(currentUrl, response);
          }
          
          this.testResults = response[langKey];
          
          if (response[langKey].data?.desktop?.audits) {
            this.desktopChartData = this.getAuditDistributionData(response[langKey].data.desktop.audits);
            this.desktopMetrics = this.getAutomatedTestMetrics(response[langKey].data.desktop.audits);
          }
          if (response[langKey].data?.mobile?.audits) {
            this.mobileChartData = this.getAuditDistributionData(response[langKey].data.mobile.audits);
            this.mobileMetrics = this.getAutomatedTestMetrics(response[langKey].data.mobile.audits);
          }
          this.cdr.detectChanges();
              setTimeout(() => {
            this.cdr.detectChanges();
          }, 100);
        } else {
          const errorResponse = response && response[langKey];
          if (errorResponse && errorResponse.error) {
            if (errorResponse.error.startsWith('accessibility-error-')) {
              this.errorMessage = this.translateService.instant(errorResponse.error);
            } else {
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