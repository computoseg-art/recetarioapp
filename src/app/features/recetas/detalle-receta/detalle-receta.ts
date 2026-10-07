import { Component, inject, OnInit } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, switchMap } from 'rxjs';
import { RecetaService } from '../../../core/services/receta';
import { Receta } from '../../../core/models/receta';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-detalle-receta',
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './detalle-receta.html',
  styleUrl: './detalle-receta.scss'
})
export class DetalleReceta implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private recetaService = inject(RecetaService);

  receta$!: Observable<Receta>;

  ngOnInit(): void {
    this.receta$ = this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id') || '';
        return this.recetaService.getRecetaPorId(id);
      })
    );
  }

  eliminarReceta(id?: string): void {
    if (!id) return;
    if (confirm('¿Estás seguro de que deseas eliminar esta receta?')) {
      this.recetaService.eliminarReceta(id).then(() => {
        this.router.navigate(['/']);
      });
    }
  }

  obtenerTextoIngrediente(ingrediente: any): string {
  if (typeof ingrediente === 'string') return ingrediente;
  if (ingrediente && typeof ingrediente === 'object') {
    const cantidad = ingrediente.cantidad ? `(${ingrediente.cantidad})` : '';
    const nombre = ingrediente.nombre || ingrediente.descripcion || '';
    return `${nombre} ${cantidad}`.trim();
  }
  return String(ingrediente);
}
}
