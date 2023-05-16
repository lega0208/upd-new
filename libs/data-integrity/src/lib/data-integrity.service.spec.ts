import { Test } from '@nestjs/testing';
import { ConsoleLogger } from '@nestjs/common';
import { DbModule } from '@dua-upd/db';
import { DbUpdateModule, DbUpdateService } from '@dua-upd/db-update';
import { DataIntegrityService } from './data-integrity.service';
import { filterInvalidUrls } from './utils';
import { environment } from '../environments/environment';

describe('DataIntegrityService', () => {
  let service: DataIntegrityService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [DbModule, DbUpdateModule.register(environment.production)],
      providers: [DataIntegrityService, DbUpdateService, ConsoleLogger],
      exports: [
        DataIntegrityService,
        DbModule,
        DbUpdateModule,
        DbUpdateService,
      ],
    }).compile();

    service = module.get(DataIntegrityService);
  });

  it('should be defined', () => {
    expect(service).toBeTruthy();
  });

  describe('purgeInvalidMetrics', () => {
    describe('filterInvalidUrls', () => {
      const validUrls = [
        'www.canada.ca/en/revenue-agency.html',
        'www.canada.ca/fr/agence-revenu.html',
        'www.canada.ca/en/revenue-agency/services/e-services/represent-a-client.html',
        'www.canada.ca/fr/agence-revenu/services/services-electroniques/services-electroniques-particuliers/dossier-particuliers/aide-dossier-1.html',
        'www.canada.ca/fr/agence-revenu/services/impot/entreprises/sujets/retenues-paie.html',
        'www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4008-payroll-deductions-supplementary-tables.html',
      ];
      const filteredValidUrls = filterInvalidUrls(validUrls, false);

      it('should return a new array', () => {
        expect(filteredValidUrls).toBeInstanceOf(Array);
        expect(filteredValidUrls).not.toBe(validUrls);
      });

      it('should return an equivalent array if keepInvalid is false and all URLs are valid', () => {
        expect(filteredValidUrls).toEqual(validUrls);
      });

      it('should return an empty array if keepInvalid is true and all URLs are valid', () => {
        const invalidUrls = filterInvalidUrls(validUrls, true);

        expect(invalidUrls.length).toBe(0);
      });

      it('should consider URLs with http(s) valid', () => {
        const urlsWithProtocol = validUrls.map((url, i) => {
          if (i % 2 === 0) {
            return `http://${url}`;
          } else {
            return `https://${url}`;
          }
        });
        const filteredUrlsWithProtocol = filterInvalidUrls(
          urlsWithProtocol,
          false
        );

        expect(filteredUrlsWithProtocol).toEqual(urlsWithProtocol);
      });

      it('should consider URLs with http(s) and/or without www. valid', () => {
        const urlsWithProtocolOrNoWww = validUrls.map((url, i) => {
          if (i % 3 === 0) {
            url = url.replace(/^www\./, '');
          }

          if (i % 2 === 0) {
            return `http://${url}`;
          }

          return `https://${url}`;
        });

        const filteredUrls = filterInvalidUrls(urlsWithProtocolOrNoWww, false);

        expect(filteredUrls).toEqual(urlsWithProtocolOrNoWww);
      });

      it('should consider URLs with a trailing slash valid', () => {
        const urls = validUrls.map((url) => url + '/');
        const filteredUrls = filterInvalidUrls(urls, false);

        expect(filteredUrls).toEqual(urls);
      });

      it('should consider URLs with "%20", "//", ".htmlhttp" or ".htmlwww" valid', () => {
        const invalidUrls = validUrls.map((url, i) => {
          if (i % 4 === 0) {
            return url + 'www';
          }

          if (i % 3 === 0) {
            return url + 'http';
          }

          if (i % 2 === 0) {
            const splitBySlash = url.split('/');
            splitBySlash[0] = splitBySlash[0] + '/';

            return splitBySlash.join('/');
          }

          return `${url}/%20`;
        });

        const filteredUrls = filterInvalidUrls(invalidUrls, false);

        expect(filteredUrls.length).toBe(0);
      });
    });
  });
});
