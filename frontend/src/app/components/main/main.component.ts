import { AuthService } from './../../services/auth/auth.service';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MovieService } from '../../services/movie/movie.service';
import { AuthUser } from '../../interfaces/auth-interface';
import { Profile } from '../../interfaces/profile-interface';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css',
})
export class MainComponent implements OnInit, OnDestroy {

  private readonly movieService = inject(MovieService);

  public currentProfile: Profile | null = null;

  posterColumns: string[][] = [];

  /** El panel central no se muestra hasta que los pósters estén cargados (o salte el timeout). */
  postersReady = signal(false);

  /** Tiempo máximo de espera antes de mostrar el panel aunque los pósters no hayan cargado. */
  private static readonly POSTER_TIMEOUT_MS = 3500;
  private fallbackTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {

    this.loadProfileFromStorage();

    // Red de seguridad: si las imágenes tardan demasiado, revelamos el panel igualmente.
    this.fallbackTimer = setTimeout(
      () => this.revealContent(),
      MainComponent.POSTER_TIMEOUT_MS,
    );

    this.movieService.getMoviesPaginated(1, 40).subscribe({
      next: res => {
        const images = res.data
          .map(m => m.image)
          .filter(Boolean);

        if (images.length) {
          this.posterColumns = this.buildColumns(images, 8);
          this.preloadPosters(images);
        } else {
          this.revealContent();
        }
      },
      error: () => this.revealContent(),
    });
  }

  ngOnDestroy(): void {
    this.clearFallbackTimer();
  }

  /** Precarga todas las imágenes a la vez; revela el panel cuando todas han terminado (cargadas o con error). */
  private preloadPosters(images: string[]): void {
    let remaining = images.length;

    const onSettled = () => {
      if (--remaining <= 0) this.revealContent();
    };

    images.forEach(src => {
      const img = new Image();
      img.onload = onSettled;
      img.onerror = onSettled;
      img.src = src;
    });
  }

  private revealContent(): void {
    this.postersReady.set(true);
    this.clearFallbackTimer();
  }

  private clearFallbackTimer(): void {
    if (this.fallbackTimer) {
      clearTimeout(this.fallbackTimer);
      this.fallbackTimer = undefined;
    }
  }

  private loadProfileFromStorage() {
    const rawProfile = localStorage.getItem('escream_profile');

    if (!rawProfile) return;

    try {
      this.currentProfile = JSON.parse(rawProfile);
    } catch {
      this.currentProfile = null;
      localStorage.removeItem('escream_profile');
    }
  }

  private buildColumns(images: string[], count: number): string[][] {

    const columns: string[][] =
      Array.from({ length: count }, () => []);

    images.forEach((img, i) => {
      columns[i % count].push(img);
    });

    return columns.map(col => [...col, ...col]);
  }
}