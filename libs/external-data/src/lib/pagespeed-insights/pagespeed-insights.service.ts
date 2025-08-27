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
  helpUrl?: string;
}

export interface AccessibilityTestResult {
  url: string;
  strategy: 'mobile' | 'desktop';
  score: number;
  scoreDisplay: string;
  audits: AccessibilityAudit[];
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
    this.logger.log(`Running accessibility test for ${url} (${strategy}) with locale: ${locale}`);

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

        // Extract help URL from description field
        // Match both English "Learn" and French "En savoir plus" or any text in square brackets
        const helpUrl = audit.description.match(/\[[^\]]+\]\((https:\/\/dequeuniversity\.com[^)]+)\)/)?.[1];

        audits.push({
          id: audit.id,
          title: audit.title,
          description: audit.description,
          score: audit.score,
          displayMode: audit.scoreDisplayMode,
          category,
          snippet,
          helpUrl,
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

  async runAccessibilityTestForBothLocales(url: string): Promise<{
    en: { desktop: AccessibilityTestResult; mobile: AccessibilityTestResult };
    fr: { desktop: AccessibilityTestResult; mobile: AccessibilityTestResult };
  }> {
    // Run English tests - try en-US which might be more specific
    const enResults = await this.runAccessibilityTestForBothStrategies(url, 'en-US');
    
    // Wait to avoid rate limiting
    await wait(800);
    
    // Run French tests - try fr-CA for Canadian French
    const frResults = await this.runAccessibilityTestForBothStrategies(url, 'fr-CA');

    return { en: enResults, fr: frResults };
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

}