import { Test, TestingModule } from '@nestjs/testing';
import { processHtml, UrlsService } from './urls.service';
import { readFile, writeFile } from 'node:fs/promises';
import { logJson } from '@dua-upd/utils-common';

// describe('UrlsService', () => {
//   let service: UrlsService;
//
//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [UrlsService],
//     }).compile();
//
//     service = module.get<UrlsService>(UrlsService);
//   });
//
//   it('should be defined', () => {
//     expect(service).toBeDefined();
//   });
// });

describe('cleanHtml', () => {
  it.concurrent('should be a string', () => {
    expect(typeof processHtml('<main>test</main>').body).toBe('string');
  });

  it.concurrent('should accept html', () => {
    expect(processHtml('<main><p>test</p></main>').body).toBe(
      '<main><p>test</p></main>'
    );
  });

  it.concurrent('should add missing closing tags', () => {
    expect(processHtml('<main><p>test</main>').body).toBe(
      '<main><p>test</p></main>'
    );
  });

  it.concurrent('should remove script tags from body', () => {
    expect(
      processHtml('<main>z<script>/regex/.test("")</script></main>').body
    ).toBe('<main>z</main>');
  });

  it.concurrent(
    'should normalize documents if the only difference is script tags',
    async () => {
      const [doc1, doc2] = await Promise.all([
        readFile(__dirname + '/test-1.html', 'utf-8'),
        readFile(__dirname + '/test-2.html', 'utf-8'),
      ]);

      expect(processHtml(doc1)).toEqual(processHtml(doc2));
    }
  );

  it.concurrent(
    'should return a title with the same non-space characters (and without " - Canada.ca")',
    async () => {
      const doc = await readFile(__dirname + '/test-2.html', 'utf-8');

      const title = processHtml(doc).title;

      const rawTitle = doc
        .match(/(?<=<title>).+(?=<\/title>)/)[0]
        .replace(/ - Canada\.ca\s*$/, '');

      expect(title?.replace(/\s/g, '')).toBe(rawTitle?.replace(/\s/g, ''));
    }
  );

  it.concurrent('should normalize whitespace in the title', async () => {
    const title = processHtml('<title> hello   ! </title><main>z</main>').title;

    expect(title).toBe('hello !');
  });

  it.concurrent('should return a an array of links', async () => {
    const doc = await readFile(__dirname + '/test-2.html', 'utf-8');
    const links = processHtml(doc).links;

    expect(Array.isArray(links)).toBe(true);
    expect(links.length).toBeGreaterThan(0);
  });
});
