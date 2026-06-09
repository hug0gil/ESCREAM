import { Component } from '@angular/core';
import { AdminCrudListComponent } from '../../admin-crud/admin-crud-list/admin-crud-list.component';

@Component({
  selector: 'app-admin-movies-list',
  standalone: true,
  imports: [AdminCrudListComponent],
  template: '<app-admin-crud-list />',
})
export class AdminMoviesListComponent {}
