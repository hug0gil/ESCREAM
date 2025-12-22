import { Component, inject } from '@angular/core';
import { Movie } from '../../../interfaces/movie-interface';
import { CommonModule } from '@angular/common';
import { SkeletonLoaderComponent } from "../../skeleton-loader/skeleton-loader.component";
import { RouterLink } from '@angular/router';
import { MovieService } from '../../../services/movie/movie.service';
import { trigger, state, style, transition, animate, query } from '@angular/animations';

@Component({
  selector: 'app-movies-list',
  standalone: true,
  imports: [CommonModule, SkeletonLoaderComponent, RouterLink],
  templateUrl: './movies-list.component.html',
  styleUrls: ['./movies-list.component.css'],
  animations: [
    // Aninmación de despliegue del menú
    trigger('filterMenuAnimation', [
      state('hidden', style({
        height: '0px',
        opacity: 0,
        transform: 'translateY(-10px)',
        overflow: 'hidden'
      })),
      state('visible', style({
        height: '*',
        opacity: 1,
        transform: 'translateY(0)',
        margin: '10px 0 50px 0'
      })),
      transition('hidden => visible', animate('0.6s ease-out')),
      transition('visible => hidden', animate('0.5s ease-in'))
    ])
  ]
})

export class MoviesListComponent {
  private service = inject(MovieService);
  public movies: Movie[] = [];
  public skeletons = new Array(6);
  public showFilter: boolean = false;

  public currentPage = 1;
  public lastPage = 1;
  public perPage = 6;
  public years = ["prueba", "prueba", "prueba"]
  public countries = []
  public genres = []


  ngOnInit() {
    this.loadMovies();
  }

  loadMovies(page: number = 1) {
    this.currentPage = page; // Damos a la página actual el valor de currentPage (variable que sumamos y restamos pulsando los botones)
    this.service.getMoviesPaginated(this.currentPage, this.perPage)
      .subscribe({
        next: (response) => {
          this.movies = response.data;
          this.lastPage = response.last_page;
          //console.log("Página actual "+page)
        },
        error: (err) => console.error('❌ Error al cargar las películas paginadas:', err)
      });
  }

  nextPage() {
    //console.log("Página siguiente")
    if (this.currentPage < this.lastPage) {
      this.loadMovies(this.currentPage + 1);
    }
  }

  prevPage() {
    //console.log("Página anterior")
    if (this.currentPage > 1) {
      this.loadMovies(this.currentPage - 1);
    }
  }

  public goToMovieDetail(movie: string) {
    console.log(movie)
  }

  toggleFilter() {
    this.showFilter = !this.showFilter;
  }

  //Control de listas desplegables

  public dropdownOpen: { [key: string]: boolean } = {
    year: false,
    genre: false,
    rating: false,
    country: false
  };

  // Función para alternar cada dropdown
  toggleDropdown(name: string) {
    this.dropdownOpen[name] = !this.dropdownOpen[name];
  }
}




// Opción moderna con callbacks, "Cuando se subscribe, se REGISTRA la función, y el Observable la ejecuta cuando EMITE"
// ngOnInit() {
//     this.service.getMovies$().subscribe({
//       next: (movieSub) => {
//         this.movies = movieSub
//       },
//       error:
//         (err) => {
//           console.error('❌ Error al cargar las películas en movies-list:', err);
//         }
//     });
//   }