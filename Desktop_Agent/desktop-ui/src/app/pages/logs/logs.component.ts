import {
  Component,
  OnInit,
  inject
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  LucideAngularModule,
  RefreshCw,
  Trash2,
  CheckCircle2,
  XCircle,
  TerminalSquare,
  Search,
  Activity,
  AlertCircle
} from 'lucide-angular';

import {
  DesktopAgentService
} from '../../core/services/desktop-agent.service';


@Component({
  selector: 'app-logs',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule
  ],

  templateUrl:
    './logs.component.html',

  styleUrl:
    './logs.component.scss'
})
export class LogsComponent
  implements OnInit {

  private readonly agent =
    inject(DesktopAgentService);


  /**
   * All logs returned by Desktop Agent.
   */
  logs: any[] = [];


  /**
   * Logs currently visible after filtering.
   */
  filteredLogs: any[] = [];


  /**
   * Page state.
   */
  loading = true;

  message = '';

  messageType: 'success' | 'error' | '' = '';


  /**
   * Search.
   */
  search = '';


  /**
   * Current status filter.
   */
  filter:
    'all' |
    'success' |
    'failed' = 'all';


  /**
   * Icons.
   */
  readonly icons = {

    RefreshCw,

    Trash2,

    CheckCircle2,

    XCircle,

    TerminalSquare,

    Search,

    Activity,

    AlertCircle

  };


  /**
   * Statistics.
   */
  get successCount(): number {

    return this.logs.filter(
      log =>
        String(log.status)
          .toLowerCase() === 'success'
    ).length;
  }


  get failureCount(): number {

    return this.logs.filter(
      log =>
        String(log.status)
          .toLowerCase() !== 'success'
    ).length;
  }


  ngOnInit(): void {

    this.load();

  }


  /**
   * Load logs from Desktop Agent.
   */
  load(): void {

    this.loading = true;

    this.message = '';


    this.agent
      .getLogs(150)
      .subscribe({

        next: response => {

          this.logs =
            response.data?.logs || [];

          this.applyFilter();

          this.loading = false;

        },


        error: error => {

          console.error(
            'Unable to load logs:',
            error
          );

          this.logs = [];

          this.filteredLogs = [];

          this.message =
            error?.error?.message ||
            'Unable to load command logs.';

          this.loading = false;

        }

      });
  }


  /**
   * Change status filter.
   */
  setFilter(
    filter:
      'all' |
      'success' |
      'failed'
  ): void {

    this.filter = filter;

    this.applyFilter();

  }


  /**
   * Apply status + search filters.
   */
  applyFilter(): void {

    const query =
      this.search
        .trim()
        .toLowerCase();


    this.filteredLogs =
      this.logs.filter(log => {

        const status =
          String(
            log.status || ''
          ).toLowerCase();


        const statusMatches =
          this.filter === 'all' ||

          (
            this.filter === 'success' &&
            status === 'success'
          ) ||

          (
            this.filter === 'failed' &&
            status !== 'success'
          );


        if (!statusMatches) {
          return false;
        }


        if (!query) {
          return true;
        }


        const searchable = [

          log.commandType,

          log.command,

          log.message,

          log.status,

          log.createdAt

        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();


        return searchable.includes(query);

      });

  }


  /**
   * Clear all logs.
   */
  clear(): void {

    if (!this.logs.length) {
      return;
    }


    if (
      !confirm(
        'Clear all command history?\n\nThis action cannot be undone.'
      )
    ) {
      return;
    }


    this.agent
      .clearLogs()
      .subscribe({

        next: () => {

          this.logs = [];

          this.filteredLogs = [];

          this.message =
            'Command history cleared successfully.';

        },


        error: error => {

          console.error(
            'Unable to clear logs:',
            error
          );

          this.message =
            error?.error?.message ||
            'Unable to clear command history.';

        }

      });

  }

}