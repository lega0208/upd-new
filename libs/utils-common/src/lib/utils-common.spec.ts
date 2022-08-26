import { batchAwait, wait } from './utils-common';
import { HttpClient } from './http';

describe('batchAwait', () => {
  it('should return values and await batches before continuing iteration', async () => {
    const ms = [20, 50, 100, 200, 500, 1000];
    const batchSize = 2;

    const startTime = Date.now();

    const mapFn = (ms: number) => wait(ms).then(() => true);

    const results = await batchAwait(ms, mapFn, batchSize);

    const endTime = Date.now();

    expect(results.every((val) => val)).toBe(true);

    expect(results.length).toBe(ms.length);

    const timeTaken = endTime - startTime;

    // 1250 comes from the sum of the greater number of each batch (50, 200, 1000)
    expect(timeTaken).toBeGreaterThanOrEqual(1250);

    // 2000 comes from total time taken if each item would be awaited (1870)
    //  + 130ms as a buffer in case of any overhead (and a nice round number)
    expect(timeTaken).toBeLessThan(2000);
  });

  it('should wait for the delay between each iteration', async () => {
    const ms = [1, 1, 1, 1, 1, 1];
    const batchSize = 5;

    const startTime = Date.now();

    const mapFn = (ms: number) => wait(ms).then(() => true);

    await batchAwait(ms, mapFn, batchSize, 30);

    const endTime = Date.now();

    const timeTaken = endTime - startTime;

    // delay should take longer than the promise in each case,
    //  so delay (30) * number of items (6) = 180ms
    expect(timeTaken).toBeGreaterThan(180);

    console.log(`Time taken for delay test: ${timeTaken}ms`);

    // but we should also make sure that it's not way longer than it should be
    expect(timeTaken).toBeLessThan(210);
  });

  it('should take a delay object and new values if it changes', async () => {
    const ms = [1, 1, 1, 1, 1, 1];
    const batchSize = 5;

    const startTime = Date.now();

    const delay = { delay: 1 };

    const mapFn = (ms: number) => wait(ms).then(() => {
      delay.delay = 20;
      return true;
    });

    await batchAwait(ms, mapFn, batchSize, delay);

    const endTime = Date.now();

    const timeTaken = endTime - startTime;

    console.log(`Time taken for dynamic delay test: ${timeTaken}ms`);

    // delay starts at 1, but is set to 20 after the first iteration,
    // so it should at least take 100ms to complete
    expect(timeTaken).toBeGreaterThan(100);
  });
});

describe('HttpClient', () => {
  const httpClient = new HttpClient();

  it('should be able to make a request', async () => {
    const response = await httpClient.get('www.google.ca');
    expect(response).toBeDefined();
  });

  it('should be able to get titles and redirects', async () => {
    const urls = [
      'www.canada.ca/fr/agence-revenu/services/services-electroniques/services-electroniques-particuliers/dossier-particuliers.html',
      'www.canada.ca/en/revenue-agency/services/e-services/candidate-profile.html',
      'www.canada.ca/en/revenue-agency/services/e-services/auto-fill-return-express-noa.html',
      'www.canada.ca/en/revenue-agency/corporate/careers-cra.html',
      'www.canada.ca/en/revenue-agency/services/child-family-benefits/canada-child-benefit-overview/canada-child-benefit-before-you-apply.html',
      'www.canada.ca/en/revenue-agency/services/payments-cra/business-payments.html',
      'www.canada.ca/en/revenue-agency/services/child-family-benefits/goods-services-tax-harmonized-sales-tax-gst-hst-credit.html',
      'www.canada.ca/en/revenue-agency/services/e-services/e-services-individuals/account-individuals/view-mail.html',
      'www.canada.ca/en/revenue-agency/services/child-family-benefits/cai-payment/climate-action-incentive-payment-calculation-sheet-2021-alberta.html',
      'www.canada.ca/en/revenue-agency/services/e-services/cra-login-services/cra-user-password-help-faqs/problems-entering-your-personal-authentication-information-account-individuals-business-account.html',
      'www.canada.ca/en/revenue-agency/services/forms-publications/forms/rc66.html',
      'www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/remitting-source-deductions.html',
      'www.canada.ca/en/revenue-agency/services/child-family-benefits/gsthstc-eligibility.html',
      'www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/payroll-deductions-contributions/employment-insurance-ei/ei-premium-rates-maximums.html',
      'www.canada.ca/en/revenue-agency/services/child-family-benefits/gsthstc-amount.html',
      'www.canada.ca/fr/agence-revenu/services/a-propos-agence-revenu-canada-arc/lorsque-vous-devez-argent-recouvrements-a-arc/recouvrement-prestation-canadienne-urgence-emise-par-service-canada.html',
      'www.canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships/report-business-income-expenses/claiming-capital-cost-allowance/classes-depreciable-property.html',
      'www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/lines-33099-33199-eligible-medical-expenses-you-claim-on-your-tax-return/details-medical-expenses.html',
      'www.canada.ca/en/revenue-agency/services/payments-cra/payment-arrangements.html',
      'www.canada.ca/en/revenue-agency/services/benefits/apply-for-cerb-with-cra.html',
      'www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-which-rate.html',
      'www.canada.ca/fr/agence-revenu/organisation/securite/id-utilisateur-revoque.html',
      'www.canada.ca/fr/agence-revenu/services/prestations/faire-demande-pcu-aupres-arc/retournez-paiement.html',
      'www.canada.ca/fr/agence-revenu/services/prestations-enfants-familles/calculateur-prestations-enfants-familles.html',
      'www.canada.ca/en/revenue-agency/services/wage-rent-subsidies/covid-wage-hiring-support-businesses.html',
      'www.canada.ca/en/revenue-agency/corporate/contact-information/individual-income-tax-enquiries-line.html',
      'www.canada.ca/en/revenue-agency/services/forms-publications/tax-packages-years/general-income-tax-benefit-package/5000-s14.html',
      'www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4001/employers-guide-payroll-deductions-remittances.html',
      'www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/complete-file-when.html',
      'www.canada.ca/fr/agence-revenu/services/services-electroniques/preremplir-declaration-express.html',
      'www.canada.ca/en/revenue-agency/services/forms-publications/forms/rc325.html',
      'www.canada.ca/fr/agence-revenu/services/prestations-enfants-familles/allocation-canadienne-enfants-apercu/allocation-canadienne-enfants-comment-calculons-nous-votre-ace.html',
      'www.canada.ca/fr/agence-revenu/services/paiements-arc.html',
      'www.canada.ca/en/revenue-agency/services/tax/businesses/topics/registering-your-business/bro-eligibility.html',
      'www.canada.ca/en/revenue-agency/services/child-family-benefits/gsthstc-apply.html',
      'www.canada.ca/en/revenue-agency/services/forms-publications/td1-personal-tax-credits-returns/td1-forms-pay-received-on-january-1-later/td1bc.html',
      'www.canada.ca/en/revenue-agency/services/scientific-research-experimental-development-tax-incentive-program/eligibility-work-investment-tax-credits-policy.html'
    ];

    const results = await httpClient.getCurrentTitlesAndUrls(urls);

    console.log(results);

    expect(results.length).toBe(urls.length);
  })
});
