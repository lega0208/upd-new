import { PathLocationStrategy, PlatformLocation } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { UrlSerializer } from '@angular/router';
import { EN_CA, FR_CA, I18nService } from '@dua-upd/upd/i18n';

@Injectable()
export class PathPreserveQueryLocationStrategy extends PathLocationStrategy {
  private platformLocation: PlatformLocation;
  private urlSerializer = inject(UrlSerializer);
  private i18n = inject(I18nService);

  private get search(): string {
    return this.platformLocation?.search ?? '';
  }

  constructor() {
    const platformLocation = inject(PlatformLocation);

    super(platformLocation);

    this.platformLocation = platformLocation;
  }

  override prepareExternalUrl(internal: string): string {
    const path = super.prepareExternalUrl(internal);
    const existingURLSearchParams = new URLSearchParams(this.search);
    const existingQueryParams = Object.fromEntries(
      existingURLSearchParams.entries(),
    );
    const urlTree = this.urlSerializer.parse(path);

    if (
      urlTree.root.hasChildren() &&
      urlTree.root.children['primary']?.segments.length
    ) {
      const langParam = urlTree.root.children['primary']?.segments[0].path;

      if (langParam !== 'en' && langParam !== 'fr') {
        const currentLang = this.i18n.currentLang;

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
