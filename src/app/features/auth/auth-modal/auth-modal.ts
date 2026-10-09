import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth-modal.html',
  styleUrl: './auth-modal.scss'
})
export class AuthModalComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  // Controla qué vista se muestra: 'opciones', 'email-login' o 'email-registro'
  modo: 'opciones' | 'email-login' | 'email-registro' = 'opciones';

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  cargando = false;
  errorMessage = '';

  async onLoginGoogle() {
    try {
      this.cargando = true;
      await this.authService.loginConGoogle();
      // Cierra el modal o recarga según tu estructura
      window.location.reload();
    } catch (error) {
      console.error('Error con Google:', error);
    } finally {
      this.cargando = false;
    }
  }

  async onSubmitEmail() {
    if (this.loginForm.invalid) return;

    const { email, password } = this.loginForm.value;
    this.cargando = true;
    this.errorMessage = '';

    try {
      if (this.modo === 'email-login') {
        await this.authService.login(email, password);
      } else {
        await this.authService.registro(email, password);
      }
      window.location.reload();
    } catch (error: any) {
      console.error('Error de autenticación:', error);
      this.errorMessage = 'Credenciales inválidas o el correo ya está registrado.';
    } finally {
      this.cargando = false;
    }
  }
}
