// plans-list.component.ts
import { Component, inject, signal } from '@angular/core';
import { SkeletonLoaderComponent } from '../../skeleton-loader/skeleton-loader.component';
import { CommonModule } from '@angular/common';
import { Plan } from '../../../interfaces/plan-interface';
import { AuthService } from '../../../services/auth/auth.service';
import { PlanService } from '../../../services/plan.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-plans-list',
  standalone: true,
  imports: [SkeletonLoaderComponent, CommonModule],
  templateUrl: './plans-list.component.html',
  styleUrl: './plans-list.component.css'
})
export class PlansListComponent {

  private planService = inject(PlanService);
  protected auth = inject(AuthService);
  private router = inject(Router);

  public plans$ = this.planService.getPlans$();
  public skeletons = new Array(3);
  protected loadingPlanId = signal<number | null>(null);
  protected successMessage = signal<string | null>(null);
  protected errorMessage = signal<string | null>(null);

  getSelectedPlan(plan: Plan): boolean {
    return plan.id === this.auth.getCurrentUser()?.planId;
  }

  protected changePlan(plan: Plan): void {
    const user = this.auth.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }
    if (this.getSelectedPlan(plan) || this.loadingPlanId()) return;

    this.loadingPlanId.set(plan.id);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    this.auth.changeSubscription(plan.id).subscribe({
      next: updated => {
        this.planService.setCurrentPlan(plan);
        this.loadingPlanId.set(null);
        this.successMessage.set(
          updated.endDate
            ? `Plan cambiado a ${plan.name}. Renovacion activa hasta ${new Date(updated.endDate).toLocaleDateString('es-ES')}.`
            : `Plan cambiado a ${plan.name}.`,
        );
      },
      error: err => {
        console.error('Error al cambiar el plan:', err);
        this.loadingPlanId.set(null);
        this.errorMessage.set('No se pudo cambiar el plan. Intentalo de nuevo.');
      },
    });
  }
}
