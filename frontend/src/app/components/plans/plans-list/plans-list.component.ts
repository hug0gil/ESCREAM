import { Component, inject } from '@angular/core';
import { SkeletonLoaderComponent } from '../../skeleton-loader/skeleton-loader.component';
import { CommonModule } from '@angular/common';
import { PlanService } from '../../../services/plan/plan.service';
import { Plan } from '../../../interfaces/plan-interface';

@Component({
  selector: 'app-plans-list',
  standalone: true,
  imports: [SkeletonLoaderComponent, CommonModule],
  templateUrl: './plans-list.component.html',
  styleUrl: './plans-list.component.css'
})
export class PlansListComponent {
  private service = inject(PlanService)
  public plans: Plan[] = [];
  public skeletons = new Array(3);

  ngOnInit() {
    this.service.getPlans$().subscribe({
      next: (planSub) => {
        this.plans = planSub
      },
      error:
        (err) => {
          console.error('❌ Error al cargar los planes en plans-list:', err);
        }
    })
  }
}
