import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { filter } from 'rxjs';
import { SQLiteService } from './services/sqlite.service';
import { ThemeService } from './services/theme.service';

// Screens that are always shown dark (they have their own dark design).
// '/splash', '/login' and '/pair-device' follow the chosen theme.
const ALWAYS_DARK_ROUTES = [
  '/create-pin',
  '/confirm-pin'
];

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {

  constructor(
    private sqliteService: SQLiteService,
    private themeService: ThemeService,
    private router: Router
  ) {
    this.themeService.init();
    this.watchRoutesForTheme();
    this.initializeSQLite();
  }

  private watchRoutesForTheme(): void {

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(event => {

        const path =
          (event as NavigationEnd).urlAfterRedirects.split('?')[0];

        this.themeService.setForceDark(
          ALWAYS_DARK_ROUTES.includes(path)
        );
      });
  }

  private async initializeSQLite(): Promise<void> {

    try {

      await this.sqliteService.initializeDatabase();

      console.log('SQLite ready.');

    } catch (error) {

      console.error(
        'Failed to initialize SQLite:',
        error
      );

    }
  }
}