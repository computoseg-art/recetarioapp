import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../../core/services/auth';
import { AuthModalComponent } from '../../../features/auth/auth-modal/auth-modal';
import { MatDivider } from '@angular/material/divider';
import { Subscription } from 'rxjs';

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
    AuthModalComponent,
    MatDivider
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class NavbarComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  private router = inject(Router);
  private userSub?: Subscription;

  user$ = this.authService.user$;
  mostrarModalAuth = false;

  ngOnInit(): void {
    // Cerramos el modal automáticamente tan pronto como el usuario inicie sesión
    this.userSub = this.user$.subscribe(user => {
      if (user) {
        this.mostrarModalAuth = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
  }

  abrirModalLogin(): void {
    this.mostrarModalAuth = true;
  }

  logout(): void {
    this.authService.logout().then(() => {
      this.router.navigate(['/']);
    });
  }

  cerrarModalSiEsFondo(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('auth-modal-backdrop')) {
      this.mostrarModalAuth = false;
    }
  }
}
