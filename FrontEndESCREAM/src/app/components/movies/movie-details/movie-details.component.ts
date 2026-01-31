import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Movie } from '../../../interfaces/movie-interface';
import { Observable, switchMap } from 'rxjs';
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

  public movie$!: Observable<Movie>;

  ngOnInit(): void {
    // 🔥 Reactivo: se actualiza automáticamente cuando cambia el parámetro slug
    this.movie$ = this.route.paramMap.pipe(
      switchMap(params => {
        const slug = params.get('slug') ?? '';
        return this.movieService.getMovieBySlug(slug);
      })
    );
  }

  goToTrailer(title?: string) {
    if (!title) return;

    // Buscamos el trailer en YouTube
    const query = encodeURIComponent(`${title} trailer`);
    const url = `https://www.youtube.com/results?search_query=${query}&sp=EgIQAQ%3D%3D`;
    window.open(url, '_blank');
  }

}