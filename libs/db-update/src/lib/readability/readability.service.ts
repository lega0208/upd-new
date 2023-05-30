import { Injectable } from '@nestjs/common';
import { load } from 'cheerio/lib/slim';
import stopwordsFr from 'stopwords-fr';
import stopwordsEn from 'stopwords-en';
import readability from 'text-readability';
import { round } from '@dua-upd/utils-common';
import { lexiqueLookup } from './utils';
import { ReadabilityScore } from '@dua-upd/types-common';

@Injectable()
export class ReadabilityService {

  async calculateReadability(
    content: string,
    lang: 'en' | 'fr'
  ): Promise<ReadabilityScore> {
    const $ = load(content);

    const main = $('main');
    const mainContent = main.text();

    const preText = mainContent
      .replace('..', '.')
      .replace('.', '. ')
      .slice(0, mainContent.indexOf('defPreFooter'))
      .replace(/[\n\t\r]/g, '');

    // add periods after bullet points and headings so that flesh kincaid considers them as sentences

    const html = load($.html().replace(/<\/(li|h[1-6]|p)>/g, '.$&'));

    html('table, div.pagedetails, #chat-bottom-bar').remove();

    const textContent = html('main').text();

    const postText = textContent
      .replace(/\.\./g, '. ')
      .replace(/(\.)\.\s/g, '$1')
      .replace(/\s+\.\s|\s+\.|(\.+)(?=$|\s)/g, '. ')
      .replace(/[\n\t\r]/g, '')
      .replace(/([.:;!?])\s*\./g, '$1 ')
      .replace(/\s+/g, ' ');

    const word = readability.lexiconCount(postText);
    const sentence = this.sentenceCount(postText);
    let syllables: number;

    if (lang === 'fr') {
      syllables =  this.syllableCountFr(postText);
    } else {
      syllables = readability.syllableCount(postText);
    }

    const original_fk = this.calculateGradeLevel(preText, syllables, lang);
    const final_fk = this.calculateGradeLevel(postText, syllables, lang);

    // HTML string to be parsed
    const mainHtml = load(main.html());

    // get all headings and calculate how many words on average between headings
    const headings = mainHtml('h1, h2, h3, h4, h5, h6');
    const len_headings = headings.length;
    const avg_words_per_header = word / len_headings;

    // get all paragraphs and all bulleted list, and calculate how many words per paragraph on average
    const paragraphs = mainHtml('p, ul');
    const len_par = paragraphs.length;
    const avg_words_per_paragraph = word / len_par;

    let fk_points: number;

    if (final_fk <= 6) fk_points = 60;
    else if (final_fk >= 18) fk_points = 0;
    else fk_points = round(60 - (final_fk - 6) * 5, 2);

    // calculate points for number of words between headings
    let header_points: number;
    if (avg_words_per_header <= 40) header_points = 20;
    else if (avg_words_per_header >= 200) header_points = 0;
    else header_points = round(20 - (avg_words_per_header - 40) * 0.125, 2);

    // calculate points for number of words per paragraph
    let paragraph_points: number;
    if (avg_words_per_paragraph <= 30) paragraph_points = 20;
    else if (avg_words_per_paragraph >= 80) paragraph_points = 0;
    else paragraph_points = round(20 - (avg_words_per_paragraph - 30) * 0.4, 2);

    // add all points
    const total_score = fk_points + header_points + paragraph_points;

    const words = await this.removeStopwords(postText, lang);
    const wordCount = await this.wordCount(words);

    const wordCounts =
      Object.entries(wordCount)
        .sort(([wordA, countA], [wordB, countB]) => countB - countA)
        .slice(0, 20)
        .map(([word, count]) => ({ word, count })) || [];

    return {
      original_score: original_fk,
      final_fk_score: final_fk,
      fk_points: fk_points,
      avg_words_per_paragraph: avg_words_per_paragraph,
      avg_words_per_header: avg_words_per_header,
      paragraph_points: paragraph_points,
      header_points: header_points,
      word_counts: wordCounts,
      total_sentences: sentence,
      total_syllables: syllables,
      total_paragraph: len_par,
      total_headings: len_headings,
      total_words: word,
      total_score: total_score,
    };
  }

  async removeStopwords(text: string, lang: string): Promise<string[]> {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]|_/g, '')
      .replace(/\s+/g, ' ')
      .split(' ');

    const stopwords = new Set(lang === 'fr' ? stopwordsFr : stopwordsEn);

    return words.filter((word) => !stopwords.has(word));
  }

  async wordCount(words: string[]): Promise<{ [key: string]: number }> {
    const wordCount = {};

    for (const word of words.filter((word) => word)) {
      wordCount[word] = (wordCount[word] || 0) + 1;
    }

    return wordCount;
  }

  syllableCountFr(text: string): number {
    const words = text
      .toLocaleLowerCase('fr-CA')
      .replace(/’/g, "'")
      .replace(/[ldjtscnm]'|[^A-zÀ-ú\-'’\s]/g, '')
      .replace(/\s+/g, ' ')
      .split(' ');
    const notFound = [];

    return words.reduce((count, word) => {
      const entry = lexiqueLookup[word];
      if (entry !== undefined) {
        return count + entry;
      } else {
        notFound.push(word);
        return count;
      }
    }, 0);
  }

  calculateGradeLevel(text: string, syllables: number, lang: string): number {
    const word = readability.lexiconCount(text);
    const sentence = this.sentenceCount(text);
    const sentenceLength = word / sentence;
    const syllablesPerWord = syllables / word;
  
    if (lang === 'fr') {
      // Kandel-Moles reading ease formula
      return readability.fleschReadingEaseToGrade(207 - 1.015 * sentenceLength - 73.6 * syllablesPerWord);
    }
  
    // Flesch-Kincaid grade level formula
    return round(0.39 * sentenceLength + 11.8 * syllablesPerWord - 15.59, 1);
  }

  sentenceCount(text: string): number {
    return text.split(/[.!?]+\s/g).filter(Boolean).length;
  }

  lexiconCount(text: string): number {
    return text.match(/(\w+)/g).length;
  }
}
