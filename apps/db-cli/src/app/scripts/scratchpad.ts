import { DbService } from '@dua-upd/db';
import { logJson, prettyJson } from '@dua-upd/utils-common';
import { readFile, writeFile } from 'fs/promises';
import { difference, zip } from 'rambdax';

/*
 *  Export any function and it'll show up with the "run-script" command.
 *
 *  Every function is run with dependencies defined in run-script.command.ts
 *  Which, as of writing this comment, is the following:
 *
 *  const scriptDependencies: Parameters<DbScript> = [this.db, this.dbUpdateService]; (DbService and DbUpdateService)
 */

export const findDuplicatePageUrls = async (db: DbService) => {
  await db.getDuplicatedPages();
};

export const reformatI18n = async (db: DbService) => {
  const en = JSON.parse(
    await readFile(
      'libs/upd/i18n/src/lib/translations/calldrivers_en-CA.json',
      'utf-8'
    )
  );

  const fr = JSON.parse(
    await readFile(
      'libs/upd/i18n/src/lib/translations/calldrivers_fr-CA.json',
      'utf-8'
    )
  );

  const enKeys = Object.keys(en);
  const frKeys = Object.keys(fr);

  const inEnNotFr = difference(enKeys, frKeys);
  const inFrNotEn = difference(frKeys, enKeys);

  if (inEnNotFr.length || inFrNotEn.length) {
    throw Error(
      `en/fr files have mismatched keys:
      in en, not fr: ${prettyJson(inEnNotFr)}
      in fr, not en: ${prettyJson(inFrNotEn)}`
    );
  }

  const translationMap = {
    enquiry_line: new Map<string, string>(),
    topic: new Map<string, string>(),
    subtopic: new Map<string, string>(),
    sub_subtopic: new Map<string, string>(),
  };

  for (const key of enKeys) {
    const enTranslations = en[key];
    const frTranslations = fr[key];

    translationMap.enquiry_line.set(
      enTranslations['inquiry line'],
      frTranslations['inquiry line']
    );

    translationMap.topic.set(enTranslations['topic'], frTranslations['topic']);

    translationMap.subtopic.set(
      enTranslations['sub-topic'],
      frTranslations['sub-topic']
    );

    translationMap.sub_subtopic.set(
      enTranslations['sub-subtopic'],
      frTranslations['sub-subtopic']
    );
  }

  const enOut = Object.fromEntries(
    Object.values(translationMap)
      .map((v) => [...v.entries()].map(([k]) => [k, k]))
      .flat()
  );
  const frOut = Object.fromEntries(
    Object.values(translationMap)
      .map((translation) => [...translation])
      .flat()
  );

  await writeFile(
    'libs/upd/i18n/src/lib/translations/calldrivers_en-CA2.json',
    prettyJson(enOut)
  );
  await writeFile(
    'libs/upd/i18n/src/lib/translations/calldrivers_fr-CA2.json',
    prettyJson(frOut)
  );
};
