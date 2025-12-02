import { Component, inject } from '@angular/core';
import { Movie } from '../../../interfaces/movie-interface';
import { CommonModule } from '@angular/common';
import { SkeletonLoaderComponent } from "../../skeleton-loader/skeleton-loader.component";
import { RouterLink } from '@angular/router';
import { MovieService } from '../../../services/movie/movie.service';

@Component({
  selector: 'app-movies-list',
  standalone: true,
  imports: [CommonModule, SkeletonLoaderComponent, RouterLink],
  templateUrl: './movies-list.component.html',
  styleUrls: ['./movies-list.component.css'],
})
export class MoviesListComponent {
  private service = inject(MovieService);
  public movies: Movie[] = [];
  public skeletons = new Array(6);

  public currentPage = 1;
  public lastPage = 1;
  public perPage = 6;


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