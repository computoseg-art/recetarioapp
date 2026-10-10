import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth-modal.html',
  styleUrl: './auth-modal.scss'
})
export class AuthModalComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private userSub?: Subscription;

  modo: 'opciones' | 'email-login' | 'email-registro' = 'opciones';

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  cargando = false;
  errorMessage = '';

  ngOnInit(): void {
    // Si el usuario cambia y ya está logueado, cerramos el modal automáticamente
    this.userSub = this.authService.user$.subscribe(user => {
      if (user) {
        // Buscamos si el modal está abierto en el DOM para cerrarlo o disparamos navegación
        this.cerrarModalAutomaticamente();
      }
    });
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
  }

  private cerrarModalAutomaticamente(): void {
    // Si manejas la visibilidad del modal desde el padre (Navbar),
    // puedes emitir un evento o cerrar la vista directamente si el componente se destruye al loguear.
  }

  async onLoginGoogle() {
    try {
      this.cargando = true;
      this.errorMessage = '';
      await this.authService.loginConGoogle();
      // El modal se cerrará automáticamente al detectarse el usuario activo
    } catch (error) {
      console.error('Error con Google:', error);
      this.errorMessage = 'No se pudo iniciar sesión con Google.';
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
    } catch (error: any) {
      console.error('Error de autenticación:', error);
      this.errorMessage = 'Credenciales inválidas o el correo ya está registrado.';
      this.cargando = false;
    }
  }
}
