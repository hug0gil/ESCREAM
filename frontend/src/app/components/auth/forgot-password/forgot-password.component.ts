import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent {
  private auth = inject(AuthService);

  submitted = false;
  loading = signal(false);
  successMsg = signal<string | null>(null);
  errorMsg = signal<string | null>(null);

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  submit(): void {
    this.submitted = true;
    this.successMsg.set(null);
    this.errorMsg.set(null);
    if (this.form.invalid) return;

    this.loading.set(true);
    this.auth.forgotPassword(this.form.value.email!).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMsg.set(
          'Si existe una cuenta con ese correo, recibirás instrucciones para cambiar la contraseña.',
        );
      },
      error: () => {
        this.loading.set(false);
        this.errorMsg.set('No se pudo solicitar el cambio de contraseña.');
      },
    });
  }
}
