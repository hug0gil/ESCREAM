import { Component } from '@angular/core';
import { AdminCrudFormComponent } from '../../admin-crud/admin-crud-form/admin-crud-form.component';

@Component({
  selector: 'app-admin-movies-form',
  standalone: true,
  imports: [AdminCrudFormComponent],
  template: '<app-admin-crud-form />',
})
export class AdminMoviesFormComponent {}
