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
  LockKeyhole,
  Sun,
  Moon
} from 'lucide-angular';

import {
  DesktopAgentService
} from '../../core/services/desktop-agent.service';

import {
  ThemeService
} from '../../core/services/theme.service';


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

  readonly themeService =
    inject(ThemeService);


  settings = {

    agentName:
      'AI Desktop Controller',

    logRetention:
      '1000',

    autoStart:
      'false'

  };


  /**
   * Current UI theme.
   *
   * Dark is the default.
   */
  theme:
    'dark' | 'light' =
    'dark';


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

    LockKeyhole,

    Sun,

    Moon

  };


  ngOnInit(): void {

    /*
     * Get the current global theme.
     */
    this.theme =
      this.themeService.getTheme();


    /*
     * Load Desktop Agent settings.
     */
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
   * Change UI theme.
   *
   * The same ThemeService is used by
   * the Topbar theme toggle.
   */
  changeTheme(
    theme: 'dark' | 'light'
  ): void {

    this.theme = theme;

    this.themeService.setTheme(
      theme
    );

  }


  /**
   * Save Desktop Agent settings.
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
   * Restore default settings.
   *
   * Dark theme is also restored as
   * the default UI theme.
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


    /*
     * Restore default theme.
     */
    this.theme =
      'dark';

    this.themeService.setTheme(
      'dark'
    );


    this.message =
      'Default values restored. Click Save settings to apply them.';

    this.messageType =
      'success';

  }

}