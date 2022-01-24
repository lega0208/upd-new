/**
 * This library should contain all the utilities related to fetching data from external APIs.
 *
 * Ideally, the specific data sources and related auth & configuration will be abstracted away
 *  using some unified API wherever possible.
 *
 *  For each data source:
 *  -A utility for building queries
 *  -Logic for configuring auth & calling the proper API endpoints
 *  -Response parsing/transforming
 *
 *  Anything else should be handled elsewhere.
 *
 *  Docs for API libraries:
 *  Airtable: https://github.com/airtable/airtable.js/
 *  Adobe Analytics: https://github.com/adobe/aio-lib-analytics
 *  Google Search Console: https://github.com/googleapis/google-api-nodejs-client
 */
