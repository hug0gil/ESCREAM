import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CreateReview, Review, ReviewPaginated } from '../interfaces/review-interface';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/reviews`;

  findAll(options: {
    page?: number;
    perPage?: number;
    profileId?: number;
    movieId?: number;
  }): Observable<ReviewPaginated> {
    let params = new HttpParams();
    if (options.page) params = params.set('page', options.page);
    if (options.perPage) params = params.set('perPage', options.perPage);
    if (options.profileId) params = params.set('profileId', options.profileId);
    if (options.movieId) params = params.set('movieId', options.movieId);
    return this.http.get<ReviewPaginated>(this.apiUrl, { params });
  }

  create(dto: CreateReview): Observable<Review> {
    return this.http.post<Review>(this.apiUrl, dto);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}