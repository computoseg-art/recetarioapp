import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  cargando = false;
  errorMessage = '';

  async onSubmitEmail() {
    if (this.loginForm.invalid) return;

    const { email, password } = this.loginForm.value;
    this.cargando = true;
    this.errorMessage = '';

    try {
      await this.authService.login(email, password);
      this.router.navigate(['/']);
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);
      this.errorMessage = 'Correo o contraseña incorrectos.';
    } finally {
      this.cargando = false;
    }
  }

  async onLoginGoogle() {
    this.cargando = true;
    this.errorMessage = '';
    try {
      await this.authService.loginConGoogle();
      this.router.navigate(['/']);
    } catch (error: any) {
      console.error('Error con Google:', error);
      this.errorMessage = 'No se pudo iniciar sesión con Google.';
    } finally {
      this.cargando = false;
    }
  }
}
