import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Movie } from '../../../interfaces/movie-interface';
import { RatingSkullsComponent } from '../rating-skulls/rating-skulls.component';

@Component({
  selector: 'app-movie-poster-card',
  standalone: true,
  imports: [RouterLink, RatingSkullsComponent],
  templateUrl: './movie-poster-card.component.html',
  styleUrl: './movie-poster-card.component.css',
})
export class MoviePosterCardComponent {
  @Input({ required: true }) movie!: Movie;

  touching = false;
  private touchTimeout?: ReturnType<typeof setTimeout>;

  onTouchStart(): void {
    this.touching = true;
    clearTimeout(this.touchTimeout);
  }

  onTouchEnd(): void {
    clearTimeout(this.touchTimeout);
    this.touchTimeout = setTimeout(() => {
      this.touching = false;
    }, 220);
  }
}
