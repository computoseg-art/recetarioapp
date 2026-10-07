import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, switchMap, take } from 'rxjs';
import { RecetaService } from '../../../core/services/receta';
import { AuthService } from '../../../core/services/auth';
import { Receta } from '../../../core/models/receta';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-detalle-receta',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule
  ],
  templateUrl: './detalle-receta.html',
  styleUrl: './detalle-receta.scss'
})
export class DetalleReceta {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private recetaService = inject(RecetaService);
  public authService = inject(AuthService);

  receta$: Observable<Receta> = this.route.paramMap.pipe(
    switchMap(params => {
      const id = params.get('id') || '';
      return this.authService.user$.pipe(
        take(1),
        switchMap(user => this.recetaService.getRecetaPorId(id, user?.uid))
      );
    })
  );

  obtenerTextoIngrediente(ingrediente: unknown): string {
    if (typeof ingrediente === 'string') {
      return ingrediente;
    }
    if (ingrediente && typeof ingrediente === 'object' && 'nombre' in ingrediente) {
      const obj = ingrediente as { cantidad?: string; nombre: string };
      return obj.cantidad ? `${obj.cantidad} - ${obj.nombre}` : obj.nombre;
    }
    return String(ingrediente);
  }

  eliminarReceta(id?: string): void {
    if (!id) return;

    if (confirm('¿Estás seguro de eliminar esta receta?')) {
      this.authService.user$.pipe(take(1)).subscribe(user => {
        if (!user) return;

        this.recetaService.eliminarReceta(id, user.uid).then(() => {
          this.router.navigate(['/']);
        });
      });
    }
  }
}
