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
  FileText,
  Trash2,
  CheckCircle2,
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
  type:
    | 'danger'
    | 'default'
    | 'chrome'
    | 'notepad'
    | 'cleanup-temp';
  systemCommand?: string;
  application?: string;
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
 * DESKTOP AGENT UPTIME
 * ================================
 */

uptime = '00:00:00';

private agentStartedAt = 0;

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
    FileText,
    Trash2,
    CheckCircle2,
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
   * SUCCESS MODAL
   * ================================
   */

  showSuccessModal = false;

  successTitle = '';

  successMessage = '';


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
      application: 'chrome',
    },

    {
      label: 'Notepad',
      icon: FileText,
      type: 'notepad',
      application: 'notepad',
    },

    {
      label: 'Clean Temp Files',
      icon: Trash2,
      type: 'cleanup-temp',
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
   * Update actual Desktop Agent uptime
   * every second.
   */
  this.uptimeInterval =
    setInterval(
      () => this.updateAgentUptime(),
      1000
    );

  /**
   * Refresh device connection state.
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

  if (this.statusInterval) {
    clearInterval(
      this.statusInterval
    );
  }

  if (this.uptimeInterval) {
    clearInterval(
      this.uptimeInterval
    );
  }
}

  /**
   * ================================
   * LOAD DESKTOP AGENT STATE
   * ================================
   *
   * Device information comes from:
   *
   * GET /pair/status
   */
  refreshDashboard(): void {
  // -----------------------------
  // 1. CHECK DESKTOP AGENT
  // -----------------------------
  this.desktopAgent.getAgentStatus().subscribe({
    next: (response: any) => {
      console.log('Agent status:', response);

      this.serverStatus = 'Running';

      if (response?.port) {
        this.port = response.port;
      }

      if (response?.startedAt) {
  this.agentStartedAt =
    new Date(response.startedAt).getTime();

  this.updateAgentUptime();
}

      
    },

    error: (error) => {
      console.error('Agent status error:', error);

      this.serverStatus = 'Offline';
      this.port = 5000;
      this.uptime = '00:00:00';

      this.pairedDevices = 0;
      this.connectedDeviceName = 'Agent unavailable';
      this.connectedDeviceId = '';
      this.deviceStatus = 'Agent unavailable';
    }
  });


  // -----------------------------
  // 2. CHECK PAIRED DEVICE
  // -----------------------------
  this.desktopAgent.getConnectionStatus().subscribe({
    next: (response: any) => {
      console.log('Pair status:', response);

      const data = response?.data;
      const device = data?.device;

      // No paired device
      if (!data || !device) {
        this.pairedDevices = 0;
        this.connectedDeviceName = 'No device connected';
        this.connectedDeviceId = '';
        this.deviceStatus = 'Disconnected';
        return;
      }

      // Device exists
      this.connectedDeviceName =
        device.deviceName || 'Android Phone';

      this.connectedDeviceId =
        device.deviceId || '';

      // IMPORTANT:
      // Count only actually connected devices
      const isConnected =
        device.status === 'connected';

      this.pairedDevices = isConnected ? 1 : 0;

      this.deviceStatus =
        isConnected
          ? 'Connected'
          : 'Disconnected';

      console.log('Connected device:', {
        name: this.connectedDeviceName,
        id: this.connectedDeviceId,
        status: device.status,
        count: this.pairedDevices
      });
    },

    error: (error) => {
      console.error('Pair status error:', error);

      this.pairedDevices = 0;
      this.connectedDeviceName = 'No device connected';
      this.connectedDeviceId = '';
      this.deviceStatus = 'Disconnected';
    }
  });
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

        next: (response: any) => {

          console.log(
            'Stop server response:',
            response
          );

          this.isExecuting = false;

          this.serverStatus =
            'Stopping...';
        },

        error: (error: any) => {

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

    if (this.isExecuting) {
      return;
    }

    /**
     * Clean temporary files.
     */
    if (
      action.type === 'cleanup-temp'
    ) {

      this.cleanTempFiles();

      return;
    }


    /**
     * Chrome does not require
     * confirmation.
     */
    if (
      action.type === 'chrome'
    ) {

      this.openApplication(
        action.application || 'chrome'
      );

      return;
    }


    /**
     * Notepad does not require
     * confirmation.
     */
    if (
      action.type === 'notepad'
    ) {

      this.openApplication(
        action.application || 'notepad'
      );

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

        next: (response: any) => {

          console.log(
            `${action.label} response:`,
            response
          );

          this.isExecuting =
            false;

          /**
           * Refresh dashboard after
           * successful command.
           */
          this.refreshDashboard();
        },


        error: (error: any) => {

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
   * CLEAN TEMP FILES
   * ================================
   */

  async cleanTempFiles(): Promise<void> {

    if (this.isExecuting) {
      return;
    }

    this.isExecuting =
      true;

    try {

      const response =
        await this.desktopAgent
          .cleanupTempFiles();

      console.log(
        'Temp cleanup response:',
        response
      );

      this.isExecuting =
        false;

      this.successTitle =
        'Clean Temp Files';

      this.successMessage =
        'Temporary files cleaned successfully.';

      this.showSuccessModal =
        true;

    } catch (error: any) {

      console.error(
        'Temp cleanup failed:',
        error
      );

      this.isExecuting =
        false;

      alert(
        this.getErrorMessage(
          error,
          'Unable to clean temporary files.'
        )
      );
    }
  }


  /**
   * ================================
   * CLOSE SUCCESS MODAL
   * ================================
   */

  closeSuccessModal(): void {

    this.showSuccessModal =
      false;

    this.successTitle =
      '';

    this.successMessage =
      '';
  }


  /**
   * ================================
   * OPEN APPLICATION
   * ================================
   */

  openApplication(
    application: string
  ): void {

    if (this.isExecuting) {
      return;
    }

    this.isExecuting =
      true;

    this.desktopAgent
      .openApplication(application)
      .subscribe({

        next: (response: any) => {

          console.log(
            `${application} command response:`,
            response
          );

          this.isExecuting =
            false;
        },

        error: (error: any) => {

          console.error(
            `Failed to open ${application}:`,
            error
          );

          this.isExecuting =
            false;

          const displayName =
            application === 'notepad'
              ? 'Notepad'
              : 'Google Chrome';

          alert(
            this.getErrorMessage(
              error,
              `Unable to open ${displayName}.`
            )
          );
        }

      });
  }


  /**
   * ================================
   * ERROR MESSAGE
   * ================================
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
  

  /**
 * ================================
 * UPDATE AGENT UPTIME
 * ================================
 */

private updateAgentUptime(): void {

  if (!this.agentStartedAt) {
    return;
  }

  const elapsed =
    Date.now() -
    this.agentStartedAt;

  const totalSeconds =
    Math.max(
      0,
      Math.floor(
        elapsed / 1000
      )
    );

  this.uptime =
    this.formatUptime(
      totalSeconds
    );
}


/**
 * ================================
 * FORMAT UPTIME
 * ================================
 */

private formatUptime(
  totalSeconds: number
): string {

  const seconds =
    Math.max(
      0,
      Math.floor(
        Number(totalSeconds) || 0
      )
    );

  const hours =
    Math.floor(
      seconds / 3600
    );

  const minutes =
    Math.floor(
      (seconds % 3600) / 60
    );

  const remainingSeconds =
    seconds % 60;

  return [
    hours
      .toString()
      .padStart(2, '0'),

    minutes
      .toString()
      .padStart(2, '0'),

    remainingSeconds
      .toString()
      .padStart(2, '0'),

  ].join(':');
}

}