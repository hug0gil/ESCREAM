import { Routes } from '@angular/router';
import { CabeceraLoginComponent } from './components/cabecera-login/cabecera-login.component';
import { MainComponent } from './components/main/main.component';
import { MoviesListComponent } from './components/movies/movies-list/movies-list.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { MovieDetailsComponent } from './components/movies/movie-details/movie-details.component';
import { PlansListComponent } from './components/plans/plans-list/plans-list.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,  // todas las rutas con header/footer
    children: [
      { path: '', component: MainComponent },
      { path: 'movies', component: MoviesListComponent },
      { path: 'plans', component: PlansListComponent },
      { path: 'movies/:slug', component: MovieDetailsComponent },
    ]
  },
  // Rutas sin layout (login, register)
  { path: 'login', component: CabeceraLoginComponent },
];
