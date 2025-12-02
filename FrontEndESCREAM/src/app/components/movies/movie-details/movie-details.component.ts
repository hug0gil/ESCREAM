import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Movie } from '../../../interfaces/movie-interface';
import { filter, take } from 'rxjs';
import { MovieService } from '../../../services/movie/movie.service';

@Component({
  selector: 'app-movie-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './movie-details.component.html',
  styleUrl: './movie-details.component.css'
})
export class MovieDetailsComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private movieService = inject(MovieService);

  public movieSlug: string = "";
  public movie: Movie | null = null;

  ngOnInit(): void {
    // Obtener slug de la URL
    this.movieSlug = this.route.snapshot.paramMap.get('slug') ?? '';

    // Esperar a que las películas estén cargadas
    this.movieService.movies$.pipe(
      filter(movies => movies.length > 0),
      take(1)
    ).subscribe(() => {
      this.loadMovie(this.movieSlug);
    });
  }

  /*
take(1) recibe la primera emisión válida y después:
  se desuscribe automáticamente
  no escucha más cambios
  no vuelve a llamar a loadMovie
 */

  loadMovie(slug: string): void {
    this.movieService.getMovieBySlug(slug).subscribe({
      next: (movie) => {
        this.movie = movie;
        console.log('✅ Película cargada');
      },
      error: (err) => {
        console.error('❌ Error al cargar película:', err);
      }
    });
  }

  goToTrailer(title?: string) {
    const url = `https://www.youtube.com/watch?search_query=${title}`;
    window.open(url, '_blank');
  }
}
