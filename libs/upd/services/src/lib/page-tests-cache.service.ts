import { Injectable } from '@angular/core';

interface AccessibilityTestResponse {
  success: boolean;
  data?: any;
  error?: string;
}

interface CoreWebVitalsTestResponse {
  success: boolean;
  data?: any;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PageTestsCacheService {
  private accessibilityCache = new Map<string, AccessibilityTestResponse>();
  private coreWebVitalsCache = new Map<string, CoreWebVitalsTestResponse>();

  // Accessibility cache methods
  getAccessibilityCache(url: string): AccessibilityTestResponse | undefined {
    return this.accessibilityCache.get(url);
  }

  setAccessibilityCache(url: string, data: AccessibilityTestResponse): void {
    this.accessibilityCache.set(url, data);
  }

  clearAccessibilityCache(): void {
    this.accessibilityCache.clear();
  }

  // Core Web Vitals cache methods
  getCoreWebVitalsCache(url: string): CoreWebVitalsTestResponse | undefined {
    return this.coreWebVitalsCache.get(url);
  }

  setCoreWebVitalsCache(url: string, data: CoreWebVitalsTestResponse): void {
    this.coreWebVitalsCache.set(url, data);
  }

  clearCoreWebVitalsCache(): void {
    this.coreWebVitalsCache.clear();
  }

  // Clear all caches
  clearAllCaches(): void {
    this.accessibilityCache.clear();
    this.coreWebVitalsCache.clear();
  }
}