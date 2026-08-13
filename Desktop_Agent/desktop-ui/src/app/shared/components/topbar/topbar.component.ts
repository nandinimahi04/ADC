import { Component, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

import {
  LucideAngularModule,
  Power,
  Wifi,
} from 'lucide-angular';

/**
 * Topbar component.
 *
 * Displays:
 * - Current page title
 * - Desktop Agent connection status
 * - Stop Server button
 */
@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    LucideAngularModule,
  ],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
})
export class TopbarComponent {

  private readonly router = inject(Router);

  /**
   * Current page title.
   */
  pageTitle = 'Dashboard';

  /**
   * Mock connection status.
   *
   * This will later come from the Desktop Agent.
   */
  isOnline = true;

  /**
   * Lucide icons.
   */
  readonly icons = {
    Power,
    Wifi,
  };

  /**
   * Page title mapping.
   */
  private readonly pageTitles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/pairing': 'QR Pairing',
    '/devices': 'Devices',
    '/logs': 'Command Logs',
    '/settings': 'Settings',
  };

  constructor() {
    this.router.events
      .pipe(
        filter(
          (event) => event instanceof NavigationEnd
        )
      )
      .subscribe((event) => {

        const navigationEnd =
          event as NavigationEnd;

        this.pageTitle =
          this.pageTitles[navigationEnd.urlAfterRedirects]
          ?? 'AI Desktop Controller';

      });
  }

  /**
   * Temporary stop-server handler.
   *
   * Actual server control will be implemented
   * during backend integration.
   */
  stopServer(): void {
    alert(
      'Stop Server will be connected to the Node.js Desktop Agent later.'
    );
  }
}