/**
 * @description Utility for tracking the count and rate of http requests, for tweaking rate-limiting
 */
export class RateLimitUtils {
  startTime?: number;
  requestCount = 0;
  requestsPerSecond = 0;
  requestsPerMinute = 0;

  startTimer() {
    this.startTime = Date.now();
  }

  ensureTimer() {
    if (!this.startTime) {
      this.startTimer();
    }
  }

  incrementRequests() {
    this.requestCount++;
  }

  updateStats() {
    if (!this.startTime) {
      throw new Error(
        'Tried to update rate-limit stats, but timer was not started'
      );
    }

    const now = Date.now();
    const delta = now - this.startTime;

    this.requestsPerSecond = (this.requestCount / delta) * 1000;
    this.requestsPerMinute = (this.requestCount / delta) * 1000 * 60;
  }

  getStats() {
    if (!this.startTime) {
      throw new Error('Tried to get stats, but timer was not started');
    }

    return {
      timeElapsed: Date.now() - this.startTime,
      requestCount: this.requestCount,
      requestsPerSecond: this.requestsPerSecond,
      requestsPerMinute: this.requestsPerMinute,
    };
  }

  reset(startTimer = true) {
    this.startTime = startTimer ? Date.now() : undefined;
    this.requestCount = 0;
    this.requestsPerSecond = 0;
    this.requestsPerMinute = 0;
  }
}
