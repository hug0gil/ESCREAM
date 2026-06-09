import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';

type TokenAction = 'verify-email' | 'confirm-email-change';

@Component({
  selector: 'app-token-action',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './token-action.component.html',
  styleUrl: './token-action.component.css',
})
export class TokenActionComponent {
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);

  loading = signal(true);
  successMsg = signal<string | null>(null);
  errorMsg = signal<string | null>(null);
  action = this.route.snapshot.data['action'] as TokenAction;

  title =
    this.action === 'confirm-email-change'
      ? 'Cambio de correo'
      : 'Verificación de cuenta';

  constructor() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.loading.set(false);
      this.errorMsg.set('El enlace no contiene token.');
      return;
    }

    const request =
      this.action === 'confirm-email-change'
        ? this.auth.confirmEmailChange(token)
        : this.auth.verifyEmail(token);

    request.subscribe({
      next: () => {
        this.loading.set(false);
        this.successMsg.set(
          this.action === 'confirm-email-change'
            ? 'Correo cambiado correctamente. Tu sesión ya muestra el correo actualizado.'
            : 'Cuenta verificada correctamente. Ya puedes iniciar sesión.',
        );
      },
      error: () => {
        this.loading.set(false);
        this.errorMsg.set('El enlace no es válido o ha caducado.');
      },
    });
  }
}
