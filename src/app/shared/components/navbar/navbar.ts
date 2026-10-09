import { Component, inject } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../../core/services/auth';
import { AuthModalComponent } from '../../../features/auth/auth-modal/auth-modal';
import { MatDivider } from '@angular/material/divider'; //

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    AuthModalComponent //
    ,
    MatDivider
],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class NavbarComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  user$ = this.authService.user$;

  // Bandera para mostrar u ocultar el modal
  mostrarModalAuth = false;

  abrirModalLogin(): void {
    this.mostrarModalAuth = true;
  }

  logout(): void {
    this.authService.logout().then(() => {
      this.router.navigate(['/']);
    });
  }

  cerrarModalSiEsFondo(event: MouseEvent): void {
    // Si el objetivo del clic es exactamente el fondo oscuro y no la tarjeta blanca, se cierra
    if ((event.target as HTMLElement).classList.contains('auth-modal-backdrop')) {
      this.mostrarModalAuth = false;
    }
  }
}
