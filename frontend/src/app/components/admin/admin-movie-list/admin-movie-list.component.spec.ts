import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminMovieListComponent } from './admin-movie-list.component';

describe('AdminMovieListComponent', () => {
  let component: AdminMovieListComponent;
  let fixture: ComponentFixture<AdminMovieListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminMovieListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminMovieListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
