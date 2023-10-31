import { NgxGoogleAnalyticsModule, NgxGoogleAnalyticsRouterModule } from 'ngx-google-analytics';

console.log('hello from environment.prod.ts');
export const environment = {
  production: true,
  envImports: [
    NgxGoogleAnalyticsModule.forRoot('G-DHQ3XDYWDC'),
    NgxGoogleAnalyticsRouterModule,

  ],
  metaReducers: []
};
