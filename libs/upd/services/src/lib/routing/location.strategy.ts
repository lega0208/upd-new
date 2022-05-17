import { PathLocationStrategy, APP_BASE_HREF, PlatformLocation } from '@angular/common';
import { Optional, Inject, Injectable } from '@angular/core';
import { UrlSerializer } from '@angular/router';
import { EN_CA, FR_CA, I18nService } from '@cra-arc/upd/i18n';

@Injectable()
export class PathPreserveQueryLocationStrategy extends PathLocationStrategy {
  private get search(): string {
    return this.platformLocation?.search ?? '';
  }

  constructor(
    private platformLocation: PlatformLocation,
    private urlSerializer: UrlSerializer,
    private i18n: I18nService,
    @Optional() @Inject(APP_BASE_HREF) _baseHref?: string,
  ) {
    super(platformLocation, _baseHref);
  }

  override prepareExternalUrl(internal: string): string {
    const path = super.prepareExternalUrl(internal);
    const existingURLSearchParams = new URLSearchParams(this.search);
    const existingQueryParams = Object.fromEntries(existingURLSearchParams.entries());
    const urlTree = this.urlSerializer.parse(path);

    if (urlTree.root.hasChildren() && urlTree.root.children['primary']?.segments.length) {
      const langParam = urlTree.root.children['primary']?.segments[0].path;

      if (langParam !== 'en' && langParam !== 'fr') {
        const currentLang = this.i18n.currentLang;
        console.log(currentLang);

        if (currentLang === EN_CA) {
          urlTree.root.children['primary'].segments[0].path = 'en';
        }

        if (currentLang === FR_CA) {
          urlTree.root.children['primary'].segments[0].path = 'fr';
        }
      }
    }

    const nextQueryParams = urlTree.queryParams;

    urlTree.queryParams = { ...existingQueryParams, ...nextQueryParams };

    return urlTree.toString();
  }
}
