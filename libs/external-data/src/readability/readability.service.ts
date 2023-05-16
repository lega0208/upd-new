import { DbService } from '@dua-upd/db';
import { Injectable } from '@nestjs/common';
import { wait } from '@dua-upd/utils-common';
import { lexiqueLookup } from './utils';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import axios from 'axios';
import { load } from 'cheerio/lib/slim';
import readability from 'text-readability';
import stopwordsFr from 'stopwords-fr';
import stopwordsEn from 'stopwords-en';
import { Types } from 'mongoose';

dayjs.extend(utc);

@Injectable()
export class ReadabilityService {
  constructor(private db: DbService) {}

  getPages() {
    return this.db.collections.pagesList
      .aggregate<{ url: string }>()
      .limit(5)
      .project({ _id: 0, url: 1 })
      .exec();
  }

  async main() {
    const pages = await this.getPages();

    for (const { url } of pages) {
      const fullUrl = `https://${url}`;

      const { data } = await axios.get(fullUrl);
      const $ = load(data);

      const html = $.html();
      const main = $('main');
      const mainContent = main.text();

      const langRegex = /canada\.ca\/(en|fr)/i;
      const lang = langRegex.exec(fullUrl)[1];

      const preText = mainContent
        .replace('..', '.')
        .replace('.', '. ')
        .slice(0, mainContent.indexOf('defPreFooter'))
        .replace(/\n/g, '')
        .replace(/\t/g, '')
        .replace(/\r/g, '');

      // add periods after bullet points and headings so that flesh kincaid considers them as sentences
      const html1 = html.replace(/<\/(li|h[1-6]|p)>/g, '.$&');

      const revText = load(html1);
      revText('table, div.pagedetails, #chat-bottom-bar').remove();
      const textContent = revText('main').text();

      const postText = textContent
        .replace(/\.\./g, '. ')
        .replace(/(\.)\.\s/g, '$1')
        .replace(/\s+\.\s|\s+\./g, '. ')
        .replace(/([.]+)(?=$|\s)/g, '. ')
        .replace(/\n|\t|\r/g, '')
        .replace(/([.:;!?])\s*\./g, '$1 ')
        .replace(/\s+/g, ' ');

      const word = readability.lexiconCount(postText);
      const sentence = this.sentenceCount(postText);
      let syllables: number;
      let original_fk: number;
      let final_fk: number;

      if (lang === 'fr') {
        syllables = this.syllableCountFr(postText);
        original_fk = this.fleschKincaidGradeFr(preText);
        final_fk = this.fleschKincaidGradeFr(postText);
      } else {
        syllables = readability.syllableCount(postText);
        original_fk = readability.fleschKincaidGrade(preText);
        final_fk = readability.fleschKincaidGrade(postText);
      }

      // HTML string to be parsed
      const mainHtml = load(main.html());

      // get all headings and calculate how many words on average between headings
      const headings = mainHtml('h1, h2, h3, h4, h5, h6');
      const len_headings = headings.length;
      const hratio = word / len_headings;

      // get all paragraphs and all bulleted list, and calculate how many words per paragraph on average
      const paragraphs = mainHtml('p, ul');
      const len_par = paragraphs.length;
      const pratio = word / len_par;

      let fkpoints: number;
      if (final_fk <= 6) fkpoints = 60;
      else if (final_fk >= 18) fkpoints = 0;
      else fkpoints = this.toFixedNumber(60 - (final_fk - 6) * 5, 2);

      // calculate points for number of words between headings
      let hpoints: number;
      if (hratio <= 40) hpoints = 20;
      else if (hratio >= 200) hpoints = 0;
      else hpoints = this.toFixedNumber(20 - (hratio - 40) * 0.125, 2);

      // calculate points for number of words per paragraph
      let ppoints: number;
      if (pratio <= 30) ppoints = 20;
      else if (pratio >= 80) ppoints = 0;
      else ppoints = this.toFixedNumber(20 - (pratio - 30) * 0.4, 2);

      // add all points
      const total_score = fkpoints + hpoints + ppoints;

      const words = await this.removeStopwords(postText, lang);
      const wordCount = await this.wordCount(words);

      const dataWord =
        Object.entries(wordCount)
          .sort(([wordA, countA], [wordB, countB]) => countB - countA)
          .slice(0, 20)
          .map(([word, count]) => ({ word, count })) || [];

      const date = new Date();

      const dataObj = {
        _id: new Types.ObjectId(),
        original_score: original_fk,
        final_fk_score: final_fk,
        fkpoints: fkpoints,
        pratio: pratio,
        hratio: hratio,
        len_par: len_par,
        len_headings: len_headings,
        total_score: total_score,
        ppoints: ppoints,
        hpoints: hpoints,
        total_words: word,
        syllables: syllables,
        data_word: dataWord,
        total_sentences: sentence,
        total_syllables: syllables,
      };

      await this.db.collections.readability.insertMany({
        ...dataObj,
        url,
        date,
      });
      wait(500);
    }
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
    for (const word of words) {
      wordCount[word] = (wordCount[word] || 0) + 1;
    }
    return wordCount;
  }

  toFixedNumber(num: number, digits: number, base = 10) {
    const pow = Math.pow(base, digits);
    return Math.round(num * pow) / pow;
  }

  syllableCountFr(text: string): number {
    const words = text
      .toLocaleLowerCase('fr-CA')
      .replace(/l'|d'|j'|t'|s'|c'|n'|m'|l’|d’|j’|t’|s’|c’|n’|m’/g, '')
      .replace(/[^A-zÀ-ú\-'’\s]|_/g, '')
      .replace(/’/g, "'")
      .replace(/\s+/g, ' ')
      .split(' ');
    const notFound = [];

    const syllableCount = words.reduce((count, word) => {
      const entry = lexiqueLookup[word];
      if (entry !== undefined) {
        return count + entry;
      } else {
        notFound.push(word);
        return count;
      }
    }, 0);

    return syllableCount;
  }

  fleschKincaidGradeFr(text: string): number {
    const word = readability.lexiconCount(text);
    const sentence = this.sentenceCount(text);
    const syllables = this.syllableCountFr(text);
    const asl = word / sentence;
    const asw = syllables / word;

    // Kandel-Moles formula
    return readability.fleschReadingEaseToGrade(207 - 1.015 * asl - 73.6 * asw);
  }

  sentenceCount(text: string): number {
    return text.split(/[.!?]+\s/g).filter(Boolean).length;
  }

  lexiconCount(text: string): number {
    return text.match(/(\w+)/g).length;
  }
}
