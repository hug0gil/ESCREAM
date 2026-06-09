import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AdminPaginated<T = any> {
  data: T[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    lastPage: number;
  };
}

@Injectable({ providedIn: 'root' })
export class AdminCrudService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  list(resource: string, page = 1, perPage = 10): Observable<AdminPaginated> {
    const params = new HttpParams()
      .set('page', page)
      .set('perPage', perPage);

    return this.http.get<AdminPaginated>(`${this.apiUrl}/${resource}`, { params });
  }

  listAll(resource: string, perPage = 200): Observable<any[]> {
    return this.list(resource, 1, perPage).pipe(map(res => res.data));
  }

  getById(resource: string, id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${resource}/${id}`);
  }

  create(resource: string, payload: Record<string, any>): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${resource}`, payload);
  }

  update(resource: string, id: number, payload: Record<string, any>): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${resource}/${id}`, payload);
  }

  delete(resource: string, id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${resource}/${id}`);
  }
}
