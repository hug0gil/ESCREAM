import { Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [],
  templateUrl: './skeleton-loader.component.html',
  styleUrl: './skeleton-loader.component.css',
  host: {
    '[class.is-plan]': "variant() === 'plan'",
    '[class.is-poster]': "variant() === 'poster'",
    'aria-hidden': 'true',
  },
})
export class SkeletonLoaderComponent {
  /** Forma del esqueleto: 'poster' (cuadrícula de películas) o 'plan' (tarjetas de suscripción). */
  readonly variant = input<'poster' | 'plan'>('poster');
}
