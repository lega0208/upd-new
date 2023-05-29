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
  it.concurrent('body should be a string', () => {
    expect(typeof processHtml('test').body).toBe('string');
  });

  it.concurrent('should accept html', () => {
    expect(processHtml('<p>test</p>').body).toBe('<p>test</p>');
  });

  it.concurrent('should add missing closing tags', () => {
    expect(() => processHtml('<p>test')).not.toThrowError();
  });

  it.concurrent('should remove script tags from body', () => {
    expect(processHtml('<script>/regex/.test("")</script>').body).toBe('');
  });

  it.concurrent('should normalize documents if the only difference is script tags', async () => {
    const [doc1, doc2] = await Promise.all([
      readFile(__dirname + '/test-1.html', 'utf-8'),
      readFile(__dirname + '/test-2.html', 'utf-8'),
    ]);

    expect(processHtml(doc1)).toEqual(processHtml(doc2));
  });

  it.concurrent('should return a an array of links', async () => {
    const doc = await readFile(__dirname + '/test-2.html', 'utf-8');
    const links = processHtml(doc).links;

    logJson(links);

    expect(Array.isArray(links)).toBe(true);
    expect(links.length).toBeGreaterThan(0);
  })
});
