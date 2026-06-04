import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Plan } from '../../interfaces/plan-interface';
import { AuthService } from '../../services/auth/auth.service';
import { PlanService } from '../../services/plan/plan.service';
import { ProfileService } from '../../services/profile/profile.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  protected auth = inject(AuthService);
  private plansService = inject(PlanService);
  protected profileService = inject(ProfileService);

  // Planes como signal para resolver planId → nombre de la suscripción
  private plans = toSignal(this.plansService.getPlans$(), {
    initialValue: [] as Plan[],
  });

  protected planName = computed(() => {
    const id = this.auth.currentUser()?.planId;
    return this.plans().find(p => p.id === id)?.name ?? '—';
  });
}
