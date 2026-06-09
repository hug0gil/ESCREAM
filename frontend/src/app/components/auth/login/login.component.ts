import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  form: FormGroup;
  submitted = false;
  loading = signal(false);
  resendLoading = signal(false);
  errorMsg = signal<string | null>(null);
  successMsg = signal<string | null>(null);
  canResendVerification = signal(false);
  showPassword = signal(false);

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  constructor() {
    this.form = new FormGroup({
      mail: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern('.*[0-9].*'),
      ]),
    });
  }

  isValid(): void {
    this.submitted = true;
    this.errorMsg.set(null);
    this.successMsg.set(null);
    this.canResendVerification.set(false);
    if (this.form.invalid) return;

    this.loading.set(true);
    const { mail, password } = this.form.value;
    this.auth.login({ email: mail, password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/profiles']);
      },
      error: err => {
        this.loading.set(false);
        const message = Array.isArray(err.error?.message)
          ? err.error.message.join(' ')
          : err.error?.message;
        this.canResendVerification.set(message === 'Email not verified');
        this.errorMsg.set(
          message === 'Email not verified'
            ? 'Tienes que verificar tu correo antes de iniciar sesión.'
            : err.status === 401
            ? 'Correo o contraseña incorrectos.'
            : 'Error al iniciar sesión. Inténtalo de nuevo.',
        );
      },
    });
  }

  resendVerification(): void {
    const mail = this.form.value.mail;
    if (!mail) return;

    this.resendLoading.set(true);
    this.errorMsg.set(null);
    this.successMsg.set(null);
    this.auth.resendVerification(mail).subscribe({
      next: () => {
        this.resendLoading.set(false);
        this.successMsg.set('Correo de verificación reenviado. Revisa también spam.');
      },
      error: () => {
        this.resendLoading.set(false);
        this.errorMsg.set('No se pudo reenviar la verificación.');
      },
    });
  }
}
