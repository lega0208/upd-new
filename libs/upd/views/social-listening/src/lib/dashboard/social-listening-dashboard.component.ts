import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { I18nFacade } from '@dua-upd/upd/state';
import { UpdComponentsModule } from '@dua-upd/upd-components';
import { ApiService } from '@dua-upd/upd/services';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'upd-social-listening-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    TranslateModule,
    UpdComponentsModule,
    ButtonModule,
    ProgressSpinnerModule,
  ],
  providers: [ApiService],
  templateUrl: './social-listening-dashboard.component.html',
  styleUrls: ['./social-listening-dashboard.component.css'],
})
export class SocialListeningDashboardComponent implements OnInit {
  private apiService = inject(ApiService);
  private http = inject(HttpClient);
  private i18n = inject(I18nFacade);

  currentLang$ = this.i18n.currentLang$;
  isLoading = false;
  redditData: any = null;
  lastFetchTime: Date | null = null;
  error: string | null = null;

  // Chart data
  sentimentChartData: any = null;
  activePosts: any[] = [];
  subredditStats: any[] = [];
  topIssues: any[] = [];

  ngOnInit() {
    // Initialize with empty data
    this.initializeChartData();
  }

  fetchRedditData() {
    this.isLoading = true;
    this.error = null;

    this.http.post<any>('/api/api/social/reddit/fetch', {}).subscribe({
      next: (data: any) => {
        this.processRedditData(data);
        this.lastFetchTime = new Date();
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error fetching Reddit data:', err);
        this.error = 'social-error-fetch-failed';
        this.isLoading = false;
      },
    });
  }

  private processRedditData(data: any) {
    // Process data for display
    this.redditData = data;

    // Update sentiment chart
    this.updateSentimentChart(data.sentiment);

    // Update active posts
    this.activePosts = data.posts?.slice(0, 5) || [];

    // Update subreddit stats
    this.subredditStats = data.stats || [];

    // Update top issues
    this.topIssues = data.issues || [];
  }

  private initializeChartData() {
    // Initialize with empty/default data
    this.sentimentChartData = {
      series: [33, 33, 34],
      labels: ['Positive', 'Neutral', 'Negative'],
      colours: ['#28a745', '#6c757d', '#dc3545'],
    };
  }

  private updateSentimentChart(sentimentData: any) {
    if (!sentimentData) return;

    const positive = sentimentData.positive || 0;
    const neutral = sentimentData.neutral || 0;
    const negative = sentimentData.negative || 0;

    this.sentimentChartData = {
      series: [positive, neutral, negative],
      labels: ['Positive', 'Neutral', 'Negative'],
      colours: ['#28a745', '#6c757d', '#dc3545'],
    };
  }

  getPostSentimentClass(sentiment: string): string {
    switch (sentiment) {
      case 'positive':
        return 'text-success';
      case 'negative':
        return 'text-danger';
      default:
        return 'text-muted';
    }
  }

  getPostSentimentIcon(sentiment: string): string {
    switch (sentiment) {
      case 'positive':
        return 'pi-thumbs-up';
      case 'negative':
        return 'pi-thumbs-down';
      default:
        return 'pi-minus';
    }
  }
}