import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Movie } from '../../../interfaces/movie-interface';
import { Observable, switchMap } from 'rxjs';
import { MovieService } from '../../../services/movie/movie.service';
import { RatingSkullsComponent } from '../rating-skulls/rating-skulls.component';

@Component({
  selector: 'app-movie-details',
  standalone: true,
  imports: [CommonModule, RatingSkullsComponent],
  templateUrl: './movie-details.component.html',
  styleUrl: './movie-details.component.css'
})

export class MovieDetailsComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private movieService = inject(MovieService);

  public movie$!: Observable<Movie>;

  ngOnInit(): void {
    this.movie$ = this.route.paramMap.pipe(
      switchMap(params => {
        const slug = params.get('slug') ?? '';
        return this.movieService.getMovieBySlug(slug);
      })
    );
  }

  goToTrailer(movie?: Movie | null) {
    // const query = encodeURIComponent(`${movie?.title} ${movie?.year}`);
    // const url = `https://www.imdb.com/es-es/find/?q=${query}`;
    if (!movie?.movie_url) return;
    const url = movie?.movie_url;
    window.open(url, '_blank');
  }

}