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
import { authGuard } from './guards/auth.guard';

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
    ],
  },
  // Resto de la app: con header/footer
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: 'movies', component: MoviesListComponent },
      { path: 'movies/:slug', component: MovieDetailsComponent },
      { path: 'plans', component: PlansListComponent },
      { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
    ],
  },
  // Cualquier otra ruta → al inicio
  { path: '**', redirectTo: '' },
];
