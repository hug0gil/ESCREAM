// plans-list.component.ts
import { Component, inject } from '@angular/core';
import { SkeletonLoaderComponent } from '../../skeleton-loader/skeleton-loader.component';
import { CommonModule } from '@angular/common';
import { Plan } from '../../../interfaces/plan-interface';
import { AuthService } from '../../../services/auth/auth.service';
import { PlanService } from '../../../services/plan.service';

@Component({
  selector: 'app-plans-list',
  standalone: true,
  imports: [SkeletonLoaderComponent, CommonModule],
  templateUrl: './plans-list.component.html',
  styleUrl: './plans-list.component.css'
})
export class PlansListComponent {

  private planService = inject(PlanService);
  private auth = inject(AuthService);

  public plans$ = this.planService.getPlans$();
  public skeletons = new Array(3);

  getSelectedPlan(plan: Plan): boolean {
    return plan.id === this.auth.getCurrentUser()?.planId;
  }
}