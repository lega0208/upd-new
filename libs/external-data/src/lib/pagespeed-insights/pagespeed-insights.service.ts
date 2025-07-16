import { Injectable, Inject, ConsoleLogger } from '@nestjs/common';
import { wait } from '@dua-upd/utils-common';
import { Retry } from '@dua-upd/utils-common';
import { PageSpeedInsightsClient } from './pagespeed-insights.client';

export interface AccessibilityAudit {
  id: string;
  title: string;
  description: string;
  score: number | null;
  displayMode: string;
  category: 'failed' | 'manual_check' | 'passed' | 'not_applicable';
  snippet?: string;
}

export interface AccessibilityTestResult {
  url: string;
  strategy: 'mobile' | 'desktop';
  score: number;
  scoreDisplay: string;
  audits: AccessibilityAudit[];
  testedAt: Date;
}

export interface WebVitalMetric {
  name: string;
  value: string;
  score: number;
  numericValue: number;
  description: string;
}

export interface CoreWebVitals {
  lcp?: WebVitalMetric;
  fid?: WebVitalMetric;
  cls?: WebVitalMetric;
  inp?: WebVitalMetric;
  fcp?: WebVitalMetric;
  si?: WebVitalMetric;
  tti?: WebVitalMetric;
  tbt?: WebVitalMetric;
}

export interface CoreWebVitalsTestResult {
  url: string;
  strategy: 'mobile' | 'desktop';
  performanceScore: number | null;
  coreWebVitals: CoreWebVitals;
  testedAt: Date;
}

@Injectable()
export class PageSpeedInsightsService {
  constructor(
    @Inject(PageSpeedInsightsClient.name)
    private readonly client: PageSpeedInsightsClient,
    private readonly logger: ConsoleLogger,
  ) {}

  @Retry(3, 1000)
  async runAccessibilityTest(
    url: string,
    strategy: 'mobile' | 'desktop' = 'desktop',
    locale?: string
  ): Promise<AccessibilityTestResult> {
    this.logger.log(`Running accessibility test for ${url} (${strategy})`);

    try {
      const response = await this.client.runPageSpeedTest({
        url,
        category: 'ACCESSIBILITY',
        strategy,
        locale,
      });

      if (!response?.lighthouseResult) {
        throw new Error('Invalid response from PageSpeed Insights API');
      }

      const { lighthouseResult } = response;
      const accessibilityCategory = lighthouseResult.categories?.accessibility;
      
      if (!accessibilityCategory) {
        throw new Error('No accessibility data in response');
      }

      const score = accessibilityCategory.score;
      const scoreDisplay = score !== null ? `${Math.round(score * 100)}%` : 'N/A';

      // Process audits
      const audits: AccessibilityAudit[] = [];
      
      for (const auditRef of accessibilityCategory.auditRefs) {
        const audit = lighthouseResult.audits[auditRef.id];
        if (!audit) continue;

        // Categorize the audit
        const category = this.categorizeAudit(audit.score, audit.scoreDisplayMode);
        
        // Extract snippet if available
        let snippet: string | undefined;
        const items = audit.details?.items;
        if (items && items.length > 0) {
          const firstItem = items[0];
          snippet = firstItem.node?.snippet || firstItem.snippet;
        }

        audits.push({
          id: audit.id,
          title: audit.title,
          description: audit.description,
          score: audit.score,
          displayMode: audit.scoreDisplayMode,
          category,
          snippet,
        });
      }

      return {
        url,
        strategy,
        score: score || 0,
        scoreDisplay,
        audits,
        testedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to run accessibility test for ${url}:`, error);
      throw error;
    }
  }

  async runAccessibilityTestForBothStrategies(url: string, locale?: string): Promise<{
    desktop: AccessibilityTestResult;
    mobile: AccessibilityTestResult;
  }> {
    // Run desktop test
    const desktop = await this.runAccessibilityTest(url, 'desktop', locale);
    
    // Wait to avoid rate limiting
    await wait(800);
    
    // Run mobile test
    const mobile = await this.runAccessibilityTest(url, 'mobile', locale);

    return { desktop, mobile };
  }

  private categorizeAudit(
    score: number | null,
    displayMode: string
  ): AccessibilityAudit['category'] {
    if (score === 0 && displayMode === 'binary') {
      return 'failed';
    } else if (displayMode === 'manual' || displayMode === 'informative') {
      return 'manual_check';
    } else if (score === 1 && displayMode === 'binary') {
      return 'passed';
    } else if (displayMode === 'notApplicable') {
      return 'not_applicable';
    } else {
      return 'not_applicable';
    }
  }

  @Retry(3, 1000)
  async runCoreWebVitalsTest(
    url: string,
    strategy: 'mobile' | 'desktop' = 'desktop',
    locale?: string
  ): Promise<CoreWebVitalsTestResult> {
    this.logger.log(`Running Core Web Vitals test for ${url} (${strategy})`);

    try {
      const response = await this.client.runPageSpeedTest({
        url,
        category: 'PERFORMANCE',
        strategy,
        locale,
      });

      if (!response?.lighthouseResult) {
        throw new Error('Invalid response from PageSpeed Insights API');
      }

      const { lighthouseResult } = response;
      const performanceCategory = lighthouseResult.categories?.performance;
      const audits = lighthouseResult.audits || {};

      // Extract Core Web Vitals
      const coreWebVitals: CoreWebVitals = {};

      // Largest Contentful Paint (LCP)
      if (audits['largest-contentful-paint']) {
        const lcp = audits['largest-contentful-paint'];
        coreWebVitals.lcp = {
          name: 'Largest Contentful Paint (LCP)',
          value: lcp.displayValue || 'N/A',
          score: lcp.score || 0,
          numericValue: lcp.numericValue || 0,
          description: 'Measures loading performance. To provide a good user experience, LCP should occur within 2.5 seconds.'
        };
      }

      // First Input Delay (FID) - using max-potential-fid as proxy
      if (audits['max-potential-fid']) {
        const fid = audits['max-potential-fid'];
        coreWebVitals.fid = {
          name: 'First Input Delay (FID)',
          value: fid.displayValue || 'N/A',
          score: fid.score || 0,
          numericValue: fid.numericValue || 0,
          description: 'Measures interactivity. To provide a good user experience, pages should have a FID of 100 milliseconds or less.'
        };
      }

      // Cumulative Layout Shift (CLS)
      if (audits['cumulative-layout-shift']) {
        const cls = audits['cumulative-layout-shift'];
        coreWebVitals.cls = {
          name: 'Cumulative Layout Shift (CLS)',
          value: cls.displayValue || 'N/A',
          score: cls.score || 0,
          numericValue: cls.numericValue || 0,
          description: 'Measures visual stability. To provide a good user experience, pages should maintain a CLS of 0.1 or less.'
        };
      }

      // Interaction to Next Paint (INP) - newer metric
      if (audits['interaction-to-next-paint']) {
        const inp = audits['interaction-to-next-paint'];
        coreWebVitals.inp = {
          name: 'Interaction to Next Paint (INP)',
          value: inp.displayValue || 'N/A',
          score: inp.score || 0,
          numericValue: inp.numericValue || 0,
          description: 'Measures responsiveness. To provide a good user experience, INP should be 200 milliseconds or less.'
        };
      }

      // Additional performance metrics
      if (audits['first-contentful-paint']) {
        const fcp = audits['first-contentful-paint'];
        coreWebVitals.fcp = {
          name: 'First Contentful Paint (FCP)',
          value: fcp.displayValue || 'N/A',
          score: fcp.score || 0,
          numericValue: fcp.numericValue || 0,
          description: 'Measures the time from page start to rendering the first bit of content.'
        };
      }

      if (audits['speed-index']) {
        const si = audits['speed-index'];
        coreWebVitals.si = {
          name: 'Speed Index',
          value: si.displayValue || 'N/A',
          score: si.score || 0,
          numericValue: si.numericValue || 0,
          description: 'Shows how quickly the contents of a page are visibly populated.'
        };
      }

      if (audits['interactive']) {
        const tti = audits['interactive'];
        coreWebVitals.tti = {
          name: 'Time to Interactive',
          value: tti.displayValue || 'N/A',
          score: tti.score || 0,
          numericValue: tti.numericValue || 0,
          description: 'Measures the time until the page is fully interactive.'
        };
      }

      if (audits['total-blocking-time']) {
        const tbt = audits['total-blocking-time'];
        coreWebVitals.tbt = {
          name: 'Total Blocking Time',
          value: tbt.displayValue || 'N/A',
          score: tbt.score || 0,
          numericValue: tbt.numericValue || 0,
          description: 'Sum of all time periods where the main thread was blocked.'
        };
      }

      return {
        url,
        strategy,
        performanceScore: performanceCategory?.score !== undefined ? Math.round(performanceCategory.score * 100) : null,
        coreWebVitals,
        testedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to run Core Web Vitals test for ${url}:`, error);
      throw error;
    }
  }

  async runCoreWebVitalsTestForBothStrategies(url: string, locale?: string): Promise<{
    desktop: CoreWebVitalsTestResult;
    mobile: CoreWebVitalsTestResult;
  }> {
    // Run desktop test
    const desktop = await this.runCoreWebVitalsTest(url, 'desktop', locale);
    
    // Wait to avoid rate limiting
    await wait(800);
    
    // Run mobile test
    const mobile = await this.runCoreWebVitalsTest(url, 'mobile', locale);

    return { desktop, mobile };
  }
}