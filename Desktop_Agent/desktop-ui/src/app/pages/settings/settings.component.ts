import {
  Component,
  OnInit,
  inject
} from '@angular/core';

import {
  FormsModule
} from '@angular/forms';

import {
  LucideAngularModule,
  Save,
  RotateCcw,
  Info,
  ShieldCheck,
  Database,
  MonitorCog,
  Settings2,
  Server,
  LockKeyhole
} from 'lucide-angular';

import {
  DesktopAgentService
} from '../../core/services/desktop-agent.service';


@Component({
  selector: 'app-settings',
  standalone: true,

  imports: [
    FormsModule,
    LucideAngularModule
  ],

  templateUrl:
    './settings.component.html',

  styleUrl:
    './settings.component.scss'
})
export class SettingsComponent
  implements OnInit {


  private readonly agent =
    inject(DesktopAgentService);


  settings = {

    agentName:
      'AI Desktop Controller',

    logRetention:
      '1000',

    autoStart:
      'false'

  };


  loading = true;

  saving = false;

  message = '';

  messageType:
    'success' |
    'error' |
    '' = '';


  readonly icons = {

    Save,

    RotateCcw,

    Info,

    ShieldCheck,

    Database,

    MonitorCog,

    Settings2,

    Server,

    LockKeyhole

  };


  ngOnInit(): void {

    this.load();

  }


  /**
   * Load settings from Desktop Agent.
   */
  load(): void {

    this.loading = true;

    this.message = '';

    this.messageType = '';


    this.agent
      .getSettings()
      .subscribe({

        next: response => {

          const saved =
            response.data?.settings ||
            response.data ||
            {};


          this.settings = {

            ...this.settings,

            ...saved

          };


          this.loading = false;

        },


        error: error => {

          console.error(
            'Settings load error:',
            error
          );

          this.loading = false;

          this.message =
            error?.error?.message ||
            'Unable to load settings.';

          this.messageType =
            'error';

        }

      });

  }


  /**
   * Save settings.
   */
  save(): void {

    const retention =
      Math.min(

        Math.max(

          Number(
            this.settings.logRetention
          ) || 1000,

          100

        ),

        10000

      );


    this.settings.logRetention =
      String(retention);


    if (
      !this.settings.agentName.trim()
    ) {

      this.message =
        'Agent name cannot be empty.';

      this.messageType =
        'error';

      return;

    }


    this.saving = true;

    this.message = '';

    this.messageType = '';


    this.agent
      .saveSettings(this.settings)
      .subscribe({

        next: () => {

          this.saving = false;

          this.message =
            'Settings saved successfully.';

          this.messageType =
            'success';

        },


        error: error => {

          console.error(
            'Settings save error:',
            error
          );

          this.saving = false;

          this.message =
            error?.error?.message ||
            'Unable to save settings.';

          this.messageType =
            'error';

        }

      });

  }


  /**
   * Restore UI defaults.
   */
  reset(): void {

    this.settings = {

      agentName:
        'AI Desktop Controller',

      logRetention:
        '1000',

      autoStart:
        'false'

    };


    this.message =
      'Default values restored. Click Save settings to apply them.';

    this.messageType =
      'success';

  }

}