import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { CommonModule } from '@angular/common';
import { MoviesListComponent } from "./components/movies/movies-list/movies-list.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, MainLayoutComponent, RouterOutlet, MoviesListComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'frontend-app';

  showLayout = true;

  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        // Oculta layout para login
        this.showLayout = !['/login', '/register'].includes(event.urlAfterRedirects);
      }
    });
  }
}
