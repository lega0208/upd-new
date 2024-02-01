import { NgxGoogleAnalyticsModule, NgxGoogleAnalyticsRouterModule } from 'ngx-google-analytics';

export const environment = {
  production: true,
  envImports: [
    NgxGoogleAnalyticsModule.forRoot('G-DHQ3XDYWDC'),
    NgxGoogleAnalyticsRouterModule,

  ],
  metaReducers: []
};
