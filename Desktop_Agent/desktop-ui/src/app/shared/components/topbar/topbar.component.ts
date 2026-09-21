
import {
  Component,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';

import {
  Router,
  NavigationEnd
} from '@angular/router';

import {
  filter
} from 'rxjs';

import {
  LucideAngularModule,
  Wifi,
  MonitorSmartphone
} from 'lucide-angular';

import {
  DesktopAgentService
} from '../../../core/services/desktop-agent.service';

import {
  ThemeService
} from '../../../core/services/theme.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    LucideAngularModule
  ],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent
  implements OnInit, OnDestroy {

  private readonly router =
    inject(Router);

  private readonly agent =
    inject(DesktopAgentService);

  readonly themeService =
    inject(ThemeService);

  pageTitle = 'Dashboard';

  isOnline = false;

  isConnected = false;

  deviceName =
    'No device connected';

  deviceId = '';

  private timer?:
    ReturnType<typeof setInterval>;

  readonly icons = {
    Wifi,
    MonitorSmartphone
  };

  private readonly pageTitles:
    Record<string, string> = {

      '/dashboard':
        'Dashboard',

      '/pairing':
        'QR Pairing',

      '/devices':
        'Devices',

      '/logs':
        'Command Logs',

      '/settings':
        'Settings'
    };

  ngOnInit(): void {

    this.refresh();

    this.timer =
      setInterval(
        () => this.refresh(),
        2000
      );

    this.router.events
      .pipe(
        filter(
          event =>
            event instanceof NavigationEnd
        )
      )
      .subscribe(event => {

        const navigation =
          event as NavigationEnd;

        this.pageTitle =
          this.pageTitles[
            navigation.urlAfterRedirects
          ] ||
          'AI Desktop Controller';
      });
  }

  ngOnDestroy(): void {

    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  refresh(): void {

    this.agent
      .getConnectionStatus()
      .subscribe({

        next: response => {

          this.isOnline = true;

          const device =
            response.data?.device;

          this.isConnected =
            !!device &&
            device.status === 'connected';

          this.deviceName =
            device?.deviceName ||
            'No device connected';

          this.deviceId =
            device?.deviceId || '';
        },

        error: error => {

          console.error(
            'Desktop Agent status error:',
            error
          );

          this.isOnline = false;

          this.isConnected = false;

          this.deviceName =
            'Agent unavailable';

          this.deviceId = '';
        }
      });
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}