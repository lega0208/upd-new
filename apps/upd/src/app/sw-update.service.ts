import { ApplicationRef, Injectable } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { first } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SwUpdateService {
  constructor(appRef: ApplicationRef, updates: SwUpdate) {
    const appIsStable$ = appRef.isStable.pipe(
      first((isStable) => isStable === true),
    );

    appIsStable$.subscribe(async () => {
      try {
        console.log('Service worker checking for updates...');

        const updateFound = await updates.checkForUpdate();

        console.log(
          updateFound
            ? 'A new version is available.'
            : 'Already on the latest version.',
        );
      } catch (err) {
        console.error('Failed to check for updates:', err);
      }
    });

    updates.versionUpdates.subscribe((evt) => {
      switch (evt.type) {
        case 'VERSION_DETECTED':
          console.log(`Downloading new app version: ${evt.version.hash}`);
          break;
        case 'VERSION_READY':
          console.log(`Current app version: ${evt.currentVersion.hash}`);
          console.log(
            `New app version ready for use: ${evt.latestVersion.hash}`,
          );

          // Reload the page to update to the latest version.
          document.location.reload();
          break;
        case 'VERSION_INSTALLATION_FAILED':
          console.log(
            `Failed to install app version '${evt.version.hash}': ${evt.error}`,
          );
          break;
      }
    });
  }
}
