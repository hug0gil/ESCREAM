import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { MainComponent } from './components/main/main.component';
import { MoviesListComponent } from './components/movies/movies-list/movies-list.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { BlankLayoutComponent } from './layout/blank-layout/blank-layout.component';
import { MovieDetailsComponent } from './components/movies/movie-details/movie-details.component';
import { PlansListComponent } from './components/plans/plans-list/plans-list.component';
import { ProfilesBrowserComponent } from './components/profiles/profiles-browser/profiles-browser.component';
import { authGuard } from './guards/auth.guard';
import { profileSelectedGuard } from './guards/profile-selected.guard';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { profileRedirectGuard } from './guards/profile-redirect.guard';

export const routes: Routes = [
  // Layout en blanco: sin header/footer, solo el logo para volver al inicio.
  // Va PRIMERO porque contiene el índice ('') → así '/' resuelve a MainComponent
  // sin depender del backtracking de Angular.
  {
    path: '',
    component: BlankLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', component: MainComponent },  // página de inicio
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      // Selector de perfiles tras iniciar sesión (pantalla limpia, sin header)
      { path: 'profiles', component: ProfilesBrowserComponent, canActivate: [authGuard] },
    ],
  },
  // Resto de la app: con header/footer
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: 'movies', component: MoviesListComponent, canActivate: [profileRedirectGuard] },
      { path: 'movies/:slug', component: MovieDetailsComponent, canActivate: [profileRedirectGuard] },
      { path: 'plans', component: PlansListComponent },
      { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard, profileSelectedGuard] },
      { path: 'admin-dashboard', component: AdminDashboardComponent, canActivate: [authGuard] }
    ],
  },
  // Cualquier otra ruta → al inicio
  { path: '**', redirectTo: '' },
];
