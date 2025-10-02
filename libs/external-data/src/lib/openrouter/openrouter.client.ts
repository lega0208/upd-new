import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

export interface SentimentAnalysisResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  reasoning?: string;
}

@Injectable()
export class OpenRouterClient {
  private readonly logger = new Logger(OpenRouterClient.name);
  private axiosInstance: AxiosInstance;
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';

    if (!this.apiKey) {
      this.logger.warn('OpenRouter API key not configured - sentiment analysis will use fallback');
    }

    this.axiosInstance = axios.create({
      baseURL: 'https://openrouter.ai/api/v1',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://upd.gc.ca', // Your app's URL
        'X-Title': 'UPD Social Listening', // Your app's name
      },
    });
  }

  async analyzeSentiment(text: string): Promise<SentimentAnalysisResult> {
    if (!this.apiKey) {
      // Fallback to basic sentiment analysis if no API key
      return this.basicSentimentAnalysis(text);
    }

    try {
      const prompt = `Analyze the sentiment of the following text about the Canada Revenue Agency (CRA) or Canadian tax services.

Text: "${text}"

Provide your analysis in the following JSON format:
{
  "sentiment": "positive" | "negative" | "neutral",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}

Consider:
- Frustration or complaints about CRA services should be marked as negative
- Praise or satisfaction with CRA services should be marked as positive
- Factual statements or questions without emotion should be neutral
- Focus on the overall tone and emotion expressed`;

      const response = await this.axiosInstance.post('/chat/completions', {
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a sentiment analysis expert specializing in analyzing public feedback about government services. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Lower temperature for more consistent results
        max_tokens: 150,
        response_format: { type: 'json_object' },
      });

      const result = response.data.choices[0].message.content;

      try {
        const parsed = JSON.parse(result);
        return {
          sentiment: parsed.sentiment || 'neutral',
          confidence: parsed.confidence || 0.5,
          reasoning: parsed.reasoning,
        };
      } catch (parseError) {
        this.logger.error('Failed to parse OpenRouter response', parseError);
        return this.basicSentimentAnalysis(text);
      }
    } catch (error) {
      this.logger.error('OpenRouter API error, falling back to basic analysis', error);
      return this.basicSentimentAnalysis(text);
    }
  }

  async analyzeSentimentBatch(texts: string[]): Promise<SentimentAnalysisResult[]> {
    if (!this.apiKey) {
      return texts.map(text => this.basicSentimentAnalysis(text));
    }

    // Process in batches to avoid rate limits
    const batchSize = 5;
    const results: SentimentAnalysisResult[] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchPromises = batch.map(text => this.analyzeSentiment(text));

      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Add a small delay between batches to respect rate limits
        if (i + batchSize < texts.length) {
          await this.sleep(1000); // 1 second delay between batches
        }
      } catch (error) {
        this.logger.error(`Batch sentiment analysis failed at index ${i}`, error);
        // Fallback for failed batch
        const fallbackResults = batch.map(text => this.basicSentimentAnalysis(text));
        results.push(...fallbackResults);
      }
    }

    return results;
  }

  private basicSentimentAnalysis(text: string): SentimentAnalysisResult {
    // Fallback to simple keyword-based sentiment analysis
    const positiveWords = [
      'good', 'great', 'excellent', 'helpful', 'thanks', 'appreciate',
      'easy', 'quick', 'fast', 'resolved', 'satisfied', 'happy',
      'efficient', 'professional', 'friendly', 'clear', 'simple', 'love',
      'perfect', 'amazing', 'wonderful', 'best', 'outstanding'
    ];

    const negativeWords = [
      'bad', 'terrible', 'awful', 'slow', 'difficult', 'confusing',
      'frustrated', 'angry', 'disappointed', 'problem', 'issue',
      'error', 'failed', 'broken', 'complicated', 'unclear', 'unfair',
      'scam', 'fraud', 'waste', 'useless', 'horrible', 'worst',
      'unacceptable', 'ridiculous', 'nightmare', 'disaster'
    ];

    const textLower = text.toLowerCase();
    let positiveScore = 0;
    let negativeScore = 0;

    positiveWords.forEach(word => {
      if (textLower.includes(word)) positiveScore++;
    });

    negativeWords.forEach(word => {
      if (textLower.includes(word)) negativeScore++;
    });

    const totalScore = positiveScore + negativeScore;

    if (totalScore === 0) {
      return { sentiment: 'neutral', confidence: 0.5 };
    }

    const confidence = Math.min(0.9, (Math.abs(positiveScore - negativeScore) / totalScore) * 0.6 + 0.3);

    if (positiveScore > negativeScore) {
      return { sentiment: 'positive', confidence };
    } else if (negativeScore > positiveScore) {
      return { sentiment: 'negative', confidence };
    } else {
      return { sentiment: 'neutral', confidence: 0.5 };
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}