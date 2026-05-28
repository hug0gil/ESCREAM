import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Movie } from '../../../interfaces/movie-interface';

/**
 * Card de película "solo portada": la portada llena la tarjeta (ratio 2:3) y
 * los datos (título, año, 💀, país) aparecen al hover/focus. Se usa tanto en la
 * rejilla de /movies como en las filas tipo Netflix de la home.
 */
@Component({
  selector: 'app-movie-poster-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './movie-poster-card.component.html',
  styleUrl: './movie-poster-card.component.css',
})
export class MoviePosterCardComponent {
  @Input({ required: true }) movie!: Movie;

  /** Array de longitud = nota (1-5) para pintar esa cantidad de 💀. */
  skulls(rating: string): number[] {
    return Array(Math.round(Number(rating) || 0)).fill(0);
  }
}
