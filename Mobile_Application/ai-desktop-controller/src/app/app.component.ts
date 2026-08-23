import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { SQLiteService } from './services/sqlite.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {

  constructor(
    private sqliteService: SQLiteService
  ) {
    this.initializeSQLite();
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