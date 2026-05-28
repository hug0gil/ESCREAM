import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  submitted = false;
  loading = signal(false);
  errorMsg = signal<string | null>(null);

  form = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.maxLength(255)]),
    mail: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern('.*[0-9].*'),
    ]),
  });

  submit(): void {
    this.submitted = true;
    this.errorMsg.set(null);
    if (this.form.invalid) return;

    this.loading.set(true);
    const { name, mail, password } = this.form.value;
    this.auth
      .register({ name: name!, email: mail!, password: password! })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.router.navigate(['/']);
        },
        error: err => {
          this.loading.set(false);
          this.errorMsg.set(
            err.status === 409
              ? 'Ese correo ya está registrado.'
              : 'No se pudo crear la cuenta. Inténtalo de nuevo.',
          );
        },
      });
  }
}
