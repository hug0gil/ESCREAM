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
  errorMsg = signal<string | null>(null);

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
    if (this.form.invalid) return;

    this.loading.set(true);
    const { mail, password } = this.form.value;
    this.auth.login({ email: mail, password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/']);
      },
      error: err => {
        this.loading.set(false);
        this.errorMsg.set(
          err.status === 401
            ? 'Correo o contraseña incorrectos.'
            : 'Error al iniciar sesión. Inténtalo de nuevo.',
        );
      },
    });
  }

  loginGithub() {
    console.log('Login en GitHub');
  }

  loginGoogle() {
    console.log('Login en Google');
  }
}
