import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MovieService } from '../../services/movie/movie.service';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css',
})
export class MainComponent implements OnInit {
  private movieService = inject(MovieService);

  /** Columnas de carteles que alimentan el carrusel del fondo. */
  posterColumns: string[][] = [];

  ngOnInit(): void {
    // Pedimos un buen puñado de portadas para llenar el fondo.
    this.movieService.getMoviesPaginated(1, 40).subscribe(res => {
      const images = res.data.map(m => m.image).filter(Boolean);
      if (images.length) {
        this.posterColumns = this.buildColumns(images, 8);
      }
    });
  }

  /**
   * Reparte las portadas en `count` columnas y duplica cada una,
   * para que el desplazamiento vertical se repita sin cortes.
   */
  private buildColumns(images: string[], count: number): string[][] {
    const columns: string[][] = Array.from({ length: count }, () => []);
    images.forEach((img, i) => columns[i % count].push(img));
    return columns.map(col => [...col, ...col]);
  }
}
