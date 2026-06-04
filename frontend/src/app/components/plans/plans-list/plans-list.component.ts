import { Component, inject } from '@angular/core';
import { SkeletonLoaderComponent } from '../../skeleton-loader/skeleton-loader.component';
import { CommonModule } from '@angular/common';
import { PlanService } from '../../../services/plan/plan.service';
import { Plan } from '../../../interfaces/plan-interface';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-plans-list',
  standalone: true,
  imports: [SkeletonLoaderComponent, CommonModule],
  templateUrl: './plans-list.component.html',
  styleUrl: './plans-list.component.css'
})
export class PlansListComponent {

  private service = inject(PlanService);
  private auth = inject(AuthService);

  public plans$ = this.service.getPlans$();

  public skeletons = new Array(3);

  getSelectedPlan(plan: Plan) {
    if (plan.id === this.auth.getCurrentUser()?.planId)
      return true;
    else return false;
  }
}
