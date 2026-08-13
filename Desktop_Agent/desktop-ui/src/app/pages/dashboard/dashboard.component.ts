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
 * Currently uses local mock data.
 *
 * Real server information will be connected
 * to the Node.js Desktop Agent in the backend
 * integration phase.
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
   * Mock server state.
   */
  serverStatus = 'Running';

  /**
   * Desktop agent port.
   */
  port = 5000;

  /**
   * Number of paired devices.
   */
  pairedDevices = 0;

  /**
   * Server start timestamp.
   */
  private startedAt = Date.now();

  /**
   * Displayed uptime.
   */
  uptime = '00:00:00';

  /**
   * Interval reference.
   */
  private uptimeInterval?: ReturnType<typeof setInterval>;

  /**
   * Icons.
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
   * Desktop Agent service.
   */
  private readonly desktopAgent =
    inject(DesktopAgentService);

  /**
   * Tracks whether an application command
   * is currently being executed.
   */
  isExecuting = false;

  /**
   * Confirmation modal state.
   */
  showConfirmation = false;
  confirmationTitle = '';
  confirmationMessage = '';
  pendingAction: QuickAction | null = null;

  readonly quickActions: QuickAction[] = [
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

  ngOnInit(): void {
    this.updateUptime();

    this.uptimeInterval = setInterval(
      () => this.updateUptime(),
      1000
    );
  }

  ngOnDestroy(): void {
    if (this.uptimeInterval) {
      clearInterval(this.uptimeInterval);
    }
  }

  /**
   * Updates dashboard uptime.
   */
  private updateUptime(): void {
    const elapsed = Date.now() - this.startedAt;

    const totalSeconds = Math.floor(elapsed / 1000);

    const hours = Math.floor(totalSeconds / 3600);

    const minutes = Math.floor(
      (totalSeconds % 3600) / 60
    );

    const seconds = totalSeconds % 60;

    this.uptime = [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0'),
    ].join(':');
  }

  /**
   * Handles Stop Server button.
   *
   * This is intentionally UI-only.
   * Actual server shutdown will be implemented
   * through the backend later.
   */
  stopServer(): void {
    alert(
      'Stop Server functionality will be connected to the Desktop Agent later.'
    );
  }

  /**
   * Handles quick actions.
   *
   * System commands show a confirmation modal first.
   * Chrome opens directly.
   */
  executeAction(action: QuickAction): void {

    if (action.type === 'chrome') {
      this.openChrome();
      return;
    }

    // System commands require confirmation
    if (action.systemCommand) {
      this.pendingAction = action;
      this.confirmationTitle = action.label;
      this.confirmationMessage =
        `Are you sure you want to ${action.label.toLowerCase()} this computer?`;
      this.showConfirmation = true;
      return;
    }
  }


  /**
   * User confirmed the system action.
   */
  confirmAction(): void {

    const action = this.pendingAction;

    this.showConfirmation = false;
    this.pendingAction = null;

    if (!action?.systemCommand || this.isExecuting) {
      return;
    }

    this.isExecuting = true;

    this.desktopAgent
      .executeSystemCommand(action.systemCommand)
      .subscribe({

        next: (response) => {

          console.log(
            `${action.label} response:`,
            response
          );

          this.isExecuting = false;

        },

        error: (error) => {

          console.error(
            `Failed to ${action.label}:`,
            error
          );

          alert(
            'Unable to connect to Desktop Agent.'
          );

          this.isExecuting = false;

        }

      });
  }


  /**
   * User cancelled the system action.
   */
  cancelAction(): void {
    this.showConfirmation = false;
    this.pendingAction = null;
  }


  /**
   * Request the Desktop Agent to open Google Chrome.
   */
  openChrome(): void {

    if (this.isExecuting) {
      return;
    }

    this.isExecuting = true;

    this.desktopAgent
      .openApplication('chrome')
      .subscribe({

        next: (response) => {

          console.log(
            'Chrome command response:',
            response
          );

          this.isExecuting = false;

        },

        error: (error) => {

          console.error(
            'Failed to open Chrome:',
            error
          );

          alert(
            'Unable to connect to Desktop Agent.'
          );

          this.isExecuting = false;

        }

      });
  }
}