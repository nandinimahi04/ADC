import {
  Component,
  OnInit,
  inject
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  LucideAngularModule,
  MonitorSmartphone,
  Wifi,
  Unplug,
  ShieldCheck,
  RefreshCw,
  Copy,
  CheckCircle2
} from 'lucide-angular';

import {
  DesktopAgentService
} from '../../core/services/desktop-agent.service';

@Component({
  selector: 'app-devices',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule
  ],
  templateUrl:
    './devices.component.html',
  styleUrl:
    './devices.component.scss'
})
export class DevicesComponent
  implements OnInit {

  private readonly agent =
    inject(DesktopAgentService);

  device: any = null;

  loading = true;

  message = '';

  copied = false;

  readonly icons = {
    MonitorSmartphone,
    Wifi,
    Unplug,
    ShieldCheck,
    RefreshCw,
    Copy,
    CheckCircle2
  };

  ngOnInit(): void {
    this.load();
  }

  load(): void {

    this.loading = true;
    this.message = '';

    this.agent
      .getConnectionStatus()
      .subscribe({

        next: response => {

          this.device =
            response.data?.device || null;

          this.loading = false;
        },

        error: error => {

          console.error(
            'Device loading error:',
            error
          );

          this.message =
            error?.error?.message ||
            'Unable to load device information.';

          this.loading = false;
        }
      });
  }

  async copyDeviceId(): Promise<void> {

    if (!this.device?.deviceId) {
      return;
    }

    try {

      await navigator.clipboard.writeText(
        this.device.deviceId
      );

      this.copied = true;

      setTimeout(() => {
        this.copied = false;
      }, 1500);

    } catch (error) {

      console.error(
        'Copy failed:',
        error
      );
    }
  }

  disconnect(): void {

    if (!this.device) {
      return;
    }

    const name =
      this.device.deviceName ||
      'Android device';

    if (
      !confirm(
        `Disconnect ${name}?`
      )
    ) {
      return;
    }

    this.agent
      .disconnectAdminDevice()
      .subscribe({

        next: () => {

          this.device = null;

          this.message =
            'Device disconnected successfully.';
        },

        error: error => {

          this.message =
            error?.error?.message ||
            'Unable to disconnect device.';
        }
      });
  }
}