import { Injector, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StorageService } from './storage/storage.service';
import { ApiService } from './api.service';

@NgModule({
  imports: [CommonModule],
  providers: [ApiService, StorageService]
})
export class ServicesModule {
  static injector: Injector; // We need this to inject services into decorators

  constructor(injector: Injector) {
    ServicesModule.injector = injector;
  }
}
