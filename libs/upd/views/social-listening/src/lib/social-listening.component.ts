import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'upd-social-listening',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="social-listening-container">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .social-listening-container {
      padding: 1rem;
    }
  `]
})
export class SocialListeningComponent {}