import {
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';

import {
  LucideAngularModule,
  Power,
  RotateCcw,
  Lock,
  Moon,
  Globe,
  AlertTriangle,
  Server,
  Smartphone,
  Clock3,
  Network,
} from 'lucide-angular';

import {
  DesktopAgentService
} from '../../core/services/desktop-agent.service';


/**
 * Quick action definition.
 */
interface QuickAction {
  label: string;
  icon: any;
  type: 'danger' | 'default' | 'chrome';
  systemCommand?: string;
}


/**
 * Dashboard page.
 *
 * All device information is loaded from the
 * Desktop Agent instead of local/mock values.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    LucideAngularModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent
  implements OnInit, OnDestroy {


  /**
   * ================================
   * SERVER STATE
   * ================================
   */

  serverStatus = 'Checking...';

  port = 5000;

  /**
   * Number of currently connected devices.
   */
  pairedDevices = 0;

  /**
   * Connected Android device name.
   */
  connectedDeviceName =
    'No device connected';

  /**
   * Connected Android device ID.
   */
  connectedDeviceId = '';

  /**
   * Device connection status.
   */
  deviceStatus =
    'Disconnected';


  /**
   * ================================
   * UPTIME
   * ================================
   */

  private startedAt = Date.now();

  uptime = '00:00:00';

  private uptimeInterval?:
    ReturnType<typeof setInterval>;

  /**
   * Refresh Desktop Agent state.
   */
  private statusInterval?:
    ReturnType<typeof setInterval>;


  /**
   * ================================
   * ICONS
   * ================================
   */

  readonly icons = {
    Power,
    RotateCcw,
    Lock,
    Moon,
    Globe,
    AlertTriangle,
    Server,
    Smartphone,
    Clock3,
    Network,
  };


  /**
   * ================================
   * SERVICE
   * ================================
   */

  private readonly desktopAgent =
    inject(DesktopAgentService);


  /**
   * ================================
   * EXECUTION STATE
   * ================================
   */

  isExecuting = false;


  /**
   * ================================
   * CONFIRMATION MODAL
   * ================================
   */

  showConfirmation = false;

  confirmationTitle = '';

  confirmationMessage = '';

  pendingAction:
    QuickAction | null = null;


  /**
   * ================================
   * QUICK ACTIONS
   * ================================
   */

  readonly quickActions:
    QuickAction[] = [

    {
      label: 'Shutdown',
      icon: Power,
      type: 'danger',
      systemCommand: 'shutdown',
    },

    {
      label: 'Restart',
      icon: RotateCcw,
      type: 'default',
      systemCommand: 'restart',
    },

    {
      label: 'Lock',
      icon: Lock,
      type: 'default',
      systemCommand: 'lock',
    },

    {
      label: 'Sleep',
      icon: Moon,
      type: 'default',
      systemCommand: 'sleep',
    },

    {
      label: 'Open Chrome',
      icon: Globe,
      type: 'chrome',
    },

  ];


  /**
   * ================================
   * INITIALIZATION
   * ================================
   */

  ngOnInit(): void {

    /**
     * Load Desktop Agent state immediately.
     */
    this.refreshDashboard();

    /**
     * Keep uptime updated.
     */
    this.updateUptime();

    this.uptimeInterval =
      setInterval(
        () => this.updateUptime(),
        1000
      );

    /**
     * Refresh device connection state.
     *
     * This makes the dashboard and navbar
     * automatically update after pairing,
     * disconnecting, or reconnecting.
     */
    this.statusInterval =
      setInterval(
        () => this.refreshDashboard(),
        2000
      );
  }


  /**
   * ================================
   * DESTROY
   * ================================
   */

  ngOnDestroy(): void {

    if (this.uptimeInterval) {

      clearInterval(
        this.uptimeInterval
      );
    }

    if (this.statusInterval) {

      clearInterval(
        this.statusInterval
      );
    }
  }


  /**
   * ================================
   * LOAD DESKTOP AGENT STATE
   * ================================
   *
   * IMPORTANT:
   *
   * This is the method that was missing
   * from your original dashboard.
   *
   * Device information comes from:
   *
   * GET /pair/status
   *
   * which reads the persisted Desktop
   * Agent device state.
   */
  refreshDashboard(): void {

    this.desktopAgent
      .getConnectionStatus()
      .subscribe({

        next: response => {

          /**
           * Desktop Agent is reachable.
           */
          this.serverStatus =
            'Running';


          /**
           * Get persisted device.
           */
          const device =
            response.data?.device;


          /**
           * Device exists.
           */
          if (device) {

            this.pairedDevices = 1;

            this.connectedDeviceName =
              device.deviceName ||
              'Android Phone';

            this.connectedDeviceId =
              device.deviceId ||
              '';

            this.deviceStatus =
              device.status === 'connected'
                ? 'Connected'
                : 'Disconnected';

          }


          /**
           * No persisted device.
           */
          else {

            this.pairedDevices = 0;

            this.connectedDeviceName =
              'No device connected';

            this.connectedDeviceId =
              '';

            this.deviceStatus =
              'Disconnected';
          }
        },


        error: error => {

          console.error(
            'Desktop Agent status error:',
            error
          );


          /**
           * Agent cannot be reached.
           */
          this.serverStatus =
            'Offline';

          this.pairedDevices = 0;

          this.connectedDeviceName =
            'Agent unavailable';

          this.connectedDeviceId =
            '';

          this.deviceStatus =
            'Agent unavailable';
        }

      });
  }


  /**
   * ================================
   * UPTIME
   * ================================
   */

  private updateUptime(): void {

    const elapsed =
      Date.now() -
      this.startedAt;

    const totalSeconds =
      Math.floor(
        elapsed / 1000
      );

    const hours =
      Math.floor(
        totalSeconds / 3600
      );

    const minutes =
      Math.floor(
        (totalSeconds % 3600) / 60
      );

    const seconds =
      totalSeconds % 60;

    this.uptime = [

      hours
        .toString()
        .padStart(2, '0'),

      minutes
        .toString()
        .padStart(2, '0'),

      seconds
        .toString()
        .padStart(2, '0'),

    ].join(':');
  }


  /**
   * ================================
   * STOP SERVER
   * ================================
   */

  stopServer(): void {

    if (this.isExecuting) {
      return;
    }

    if (
      !confirm(
        'Stop the Desktop Agent server?'
      )
    ) {
      return;
    }

    this.isExecuting = true;

    this.desktopAgent
      .stopServer()
      .subscribe({

        next: response => {

          console.log(
            'Stop server response:',
            response
          );

          this.isExecuting = false;

          this.serverStatus =
            'Stopping...';
        },

        error: error => {

          console.error(
            'Failed to stop Desktop Agent:',
            error
          );

          this.isExecuting = false;

          alert(
            this.getErrorMessage(
              error,
              'Unable to stop Desktop Agent.'
            )
          );
        }

      });
  }


  /**
   * ================================
   * QUICK ACTION
   * ================================
   */

  executeAction(
    action: QuickAction
  ): void {

    /**
     * Chrome does not require
     * confirmation.
     */
    if (
      action.type === 'chrome'
    ) {

      this.openChrome();

      return;
    }


    /**
     * System commands require
     * confirmation.
     */
    if (
      action.systemCommand
    ) {

      this.pendingAction =
        action;

      this.confirmationTitle =
        action.label;

      this.confirmationMessage =
        `Are you sure you want to ${action.label.toLowerCase()} this computer?`;

      this.showConfirmation =
        true;

      return;
    }
  }


  /**
   * ================================
   * CONFIRM SYSTEM ACTION
   * ================================
   */

  confirmAction(): void {

    const action =
      this.pendingAction;

    this.showConfirmation =
      false;

    this.pendingAction =
      null;


    if (
      !action?.systemCommand ||
      this.isExecuting
    ) {

      return;
    }


    this.isExecuting =
      true;


    this.desktopAgent
      .executeSystemCommand(
        action.systemCommand
      )
      .subscribe({

        next: response => {

          console.log(
            `${action.label} response:`,
            response
          );

          this.isExecuting =
            false;

          /**
           * Refresh logs/device state after
           * successful command.
           */
          this.refreshDashboard();
        },


        error: error => {

          console.error(
            `Failed to ${action.label}:`,
            error
          );

          this.isExecuting =
            false;

          alert(
            this.getErrorMessage(
              error,
              `Unable to execute ${action.label}.`
            )
          );
        }

      });
  }


  /**
   * ================================
   * CANCEL ACTION
   * ================================
   */

  cancelAction(): void {

    this.showConfirmation =
      false;

    this.pendingAction =
      null;
  }


  /**
   * ================================
   * OPEN CHROME
   * ================================
   */

  openChrome(): void {

    if (this.isExecuting) {
      return;
    }


    this.isExecuting =
      true;


    this.desktopAgent
      .openApplication('chrome')
      .subscribe({

        next: response => {

          console.log(
            'Chrome command response:',
            response
          );

          this.isExecuting =
            false;
        },


        error: error => {

          console.error(
            'Failed to open Chrome:',
            error
          );

          this.isExecuting =
            false;

          alert(
            this.getErrorMessage(
              error,
              'Unable to open Google Chrome.'
            )
          );
        }

      });
  }


  /**
   * ================================
   * ERROR MESSAGE
   * ================================
   *
   * Prevents every backend error from
   * being incorrectly shown as:
   *
   * "Unable to connect to Desktop Agent."
   */
  private getErrorMessage(
    error: any,
    fallback: string
  ): string {

    return (
      error?.error?.message ||
      error?.message ||
      fallback
    );
  }

}