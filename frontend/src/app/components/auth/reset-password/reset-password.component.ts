import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent {
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);

  token = this.route.snapshot.queryParamMap.get('token');
  submitted = false;
  loading = signal(false);
  successMsg = signal<string | null>(null);
  errorMsg = signal<string | null>(
    this.token ? null : 'El enlace de recuperación no contiene token.',
  );
  showPassword = signal(false);

  form = new FormGroup({
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern('.*[0-9].*'),
    ]),
    confirmPassword: new FormControl('', [Validators.required]),
  });

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  submit(): void {
    this.submitted = true;
    this.successMsg.set(null);
    this.errorMsg.set(null);
    if (!this.token) {
      this.errorMsg.set('El enlace de recuperación no contiene token.');
      return;
    }
    if (this.form.invalid) return;
    if (this.form.value.password !== this.form.value.confirmPassword) {
      this.errorMsg.set('Las contraseñas no coinciden.');
      return;
    }

    this.loading.set(true);
    this.auth
      .resetPassword({ token: this.token, password: this.form.value.password! })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.successMsg.set('Contraseña cambiada. Se ha cerrado tu sesión.');
          this.form.reset();
          this.submitted = false;
        },
        error: () => {
          this.loading.set(false);
          this.errorMsg.set('El enlace no es válido o ha caducado.');
        },
      });
  }
}
