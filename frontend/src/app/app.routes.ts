import { Routes } from '@angular/router';
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
import { profileRedirectGuard } from './guards/profile-redirect.guard';
import { LoginComponent } from './components/auth/login/login.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { ADMIN_CRUD_CONFIGS } from './components/admin/admin-crud/admin-crud.config';
import { AdminMoviesListComponent } from './components/admin/admin-movies/admin-movies-list/admin-movies-list.component';
import { AdminMoviesFormComponent } from './components/admin/admin-movies/admin-movies-form/admin-movies-form.component';
import { AdminReviewsListComponent } from './components/admin/admin-reviews/admin-reviews-list/admin-reviews-list.component';
import { AdminReviewsFormComponent } from './components/admin/admin-reviews/admin-reviews-form/admin-reviews-form.component';
import { AdminUsersListComponent } from './components/admin/admin-users/admin-users-list/admin-users-list.component';
import { AdminUsersFormComponent } from './components/admin/admin-users/admin-users-form/admin-users-form.component';
import { AdminDirectorsListComponent } from './components/admin/admin-directors/admin-directors-list/admin-directors-list.component';
import { AdminDirectorsFormComponent } from './components/admin/admin-directors/admin-directors-form/admin-directors-form.component';
import { AdminActorsListComponent } from './components/admin/admin-actors/admin-actors-list/admin-actors-list.component';
import { AdminActorsFormComponent } from './components/admin/admin-actors/admin-actors-form/admin-actors-form.component';
import { AdminProductionCompaniesListComponent } from './components/admin/admin-production-companies/admin-production-companies-list/admin-production-companies-list.component';
import { AdminProductionCompaniesFormComponent } from './components/admin/admin-production-companies/admin-production-companies-form/admin-production-companies-form.component';
import { AdminSubgenresListComponent } from './components/admin/admin-subgenres/admin-subgenres-list/admin-subgenres-list.component';
import { AdminSubgenresFormComponent } from './components/admin/admin-subgenres/admin-subgenres-form/admin-subgenres-form.component';

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

      // ADMIN
      { path: 'admin-dashboard', component: AdminDashboardComponent, canActivate: [authGuard] },
      { path: 'admin-dashboard/movies', component: AdminMoviesListComponent, canActivate: [authGuard], data: { adminCrud: ADMIN_CRUD_CONFIGS['movies'] } },
      { path: 'admin-dashboard/movies/new', component: AdminMoviesFormComponent, canActivate: [authGuard], data: { adminCrud: ADMIN_CRUD_CONFIGS['movies'] } },
      { path: 'admin-dashboard/movies/:id/edit', component: AdminMoviesFormComponent, canActivate: [authGuard], data: { adminCrud: ADMIN_CRUD_CONFIGS['movies'] } },
      { path: 'admin-dashboard/reviews', component: AdminReviewsListComponent, canActivate: [authGuard], data: { adminCrud: ADMIN_CRUD_CONFIGS['reviews'] } },
      { path: 'admin-dashboard/reviews/new', component: AdminReviewsFormComponent, canActivate: [authGuard], data: { adminCrud: ADMIN_CRUD_CONFIGS['reviews'] } },
      { path: 'admin-dashboard/reviews/:id/edit', component: AdminReviewsFormComponent, canActivate: [authGuard], data: { adminCrud: ADMIN_CRUD_CONFIGS['reviews'] } },
      { path: 'admin-dashboard/users', component: AdminUsersListComponent, canActivate: [authGuard], data: { adminCrud: ADMIN_CRUD_CONFIGS['users'] } },
      { path: 'admin-dashboard/users/new', component: AdminUsersFormComponent, canActivate: [authGuard], data: { adminCrud: ADMIN_CRUD_CONFIGS['users'] } },
      { path: 'admin-dashboard/users/:id/edit', component: AdminUsersFormComponent, canActivate: [authGuard], data: { adminCrud: ADMIN_CRUD_CONFIGS['users'] } },
      { path: 'admin-dashboard/directors', component: AdminDirectorsListComponent, canActivate: [authGuard], data: { adminCrud: ADMIN_CRUD_CONFIGS['directors'] } },
      { path: 'admin-dashboard/directors/new', component: AdminDirectorsFormComponent, canActivate: [authGuard], data: { adminCrud: ADMIN_CRUD_CONFIGS['directors'] } },
      { path: 'admin-dashboard/directors/:id/edit', component: AdminDirectorsFormComponent, canActivate: [authGuard], data: { adminCrud: ADMIN_CRUD_CONFIGS['directors'] } },
      { path: 'admin-dashboard/actors', component: AdminActorsListComponent, canActivate: [authGuard], data: { adminCrud: ADMIN_CRUD_CONFIGS['actors'] } },
      { path: 'admin-dashboard/actors/new', component: AdminActorsFormComponent, canActivate: [authGuard], data: { adminCrud: ADMIN_CRUD_CONFIGS['actors'] } },
      { path: 'admin-dashboard/actors/:id/edit', component: AdminActorsFormComponent, canActivate: [authGuard], data: { adminCrud: ADMIN_CRUD_CONFIGS['actors'] } },
      { path: 'admin-dashboard/production-companies', component: AdminProductionCompaniesListComponent, canActivate: [authGuard], data: { adminCrud: ADMIN_CRUD_CONFIGS['production-companies'] } },
      { path: 'admin-dashboard/production-companies/new', component: AdminProductionCompaniesFormComponent, canActivate: [authGuard], data: { adminCrud: ADMIN_CRUD_CONFIGS['production-companies'] } },
      { path: 'admin-dashboard/production-companies/:id/edit', component: AdminProductionCompaniesFormComponent, canActivate: [authGuard], data: { adminCrud: ADMIN_CRUD_CONFIGS['production-companies'] } },
      { path: 'admin-dashboard/subgenres', component: AdminSubgenresListComponent, canActivate: [authGuard], data: { adminCrud: ADMIN_CRUD_CONFIGS['subgenres'] } },
      { path: 'admin-dashboard/subgenres/new', component: AdminSubgenresFormComponent, canActivate: [authGuard], data: { adminCrud: ADMIN_CRUD_CONFIGS['subgenres'] } },
      { path: 'admin-dashboard/subgenres/:id/edit', component: AdminSubgenresFormComponent, canActivate: [authGuard], data: { adminCrud: ADMIN_CRUD_CONFIGS['subgenres'] } },
    ],
  },
  // Cualquier otra ruta → al inicio
  { path: '**', redirectTo: '' },
];
