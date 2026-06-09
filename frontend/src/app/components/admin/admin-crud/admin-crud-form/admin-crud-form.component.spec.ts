import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { AdminCrudFormComponent } from './admin-crud-form.component';
import { ADMIN_CRUD_CONFIGS } from '../admin-crud.config';
import { AdminCrudService } from '../../../../services/admin-crud.service';

describe('AdminCrudFormComponent', () => {
  let component: AdminCrudFormComponent;
  let fixture: ComponentFixture<AdminCrudFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCrudFormComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: { adminCrud: ADMIN_CRUD_CONFIGS['directors'] },
              paramMap: { get: () => null },
            },
          },
        },
        {
          provide: AdminCrudService,
          useValue: {
            listAll: () => of([]),
            create: () => of({}),
            update: () => of({}),
            getById: () => of({}),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminCrudFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
