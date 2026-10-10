import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Receta } from '../../../core/models/receta';
import { RecetaService } from '../../../core/services/receta';
import { AuthService } from '../../../core/services/auth'; // <--- Importar AuthService

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { toSignal } from '@angular/core/rxjs-interop'; // <--- Para leer el usuario de forma reactiva

@Component({
  selector: 'app-receta-card',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './receta-card.html',
  styleUrl: './receta-card.scss'
})
export class RecetaCard {
  @Input({ required: true }) receta!: Receta;
  @Input() usuarioActualId: string | null = null; // Opcional por compatibilidad

  private recetaService = inject(RecetaService);
  private authService = inject(AuthService); // <--- Inyectar AuthService

  // Obtenemos el usuario actual de forma reactiva y limpia
  private usuarioActual = toSignal(this.authService.user$);

  imagenPredeterminada = 'https://placehold.co/600x400?text=Sin+Imagen';

  // Getter unificado para obtener el UID correcto (ya sea por Input o directo del servicio)
  private get currentUid(): string | null {
    return this.usuarioActualId || this.usuarioActual()?.uid || null;
  }

  // Evalúa si la receta está en favoritos del usuario
  get esFavorito(): boolean {
    const uid = this.currentUid;
    return !!(
      this.receta?.favoritosPor &&
      uid &&
      this.receta.favoritosPor.includes(uid)
    );
  }

  // Cambia el estado de favorito de forma inmediata
  async toggleFavorito(event: Event): Promise<void> {
    event.stopPropagation();

    const uid = this.currentUid;

    if (!uid) {
      alert('Debes iniciar sesión para guardar favoritos.');
      return;
    }

    if (!this.receta?.id) return;

    if (!this.receta.favoritosPor) {
      this.receta.favoritosPor = [];
    }

    const estadoAnterior = this.esFavorito;

    // Actualización local optimista
    if (estadoAnterior) {
      this.receta.favoritosPor = this.receta.favoritosPor.filter(id => id !== uid);
    } else {
      this.receta.favoritosPor.push(uid);
    }

    try {
      await this.recetaService.toggleFavorito(
        this.receta.id,
        uid,
        estadoAnterior
      );
    } catch (error) {
      console.error('Error al guardar favorito en Firestore:', error);
      // Revertir en caso de error
      if (estadoAnterior) {
        this.receta.favoritosPor.push(uid);
      } else {
        this.receta.favoritosPor = this.receta.favoritosPor.filter(id => id !== uid);
      }
    }
  }

  get imagenUrlSanitizada(): string {
    if (!this.receta?.imagenUrl) return this.imagenPredeterminada;

    let url = this.receta.imagenUrl.trim();

    if (url.startsWith('https://https//')) {
      url = url.replace('https://https//', 'https://');
    } else if (url.startsWith('http://https://')) {
      url = url.replace('http://https://', 'https://');
    } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    return url;
  }

  manejarErrorImagen(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = this.imagenPredeterminada;
  }
}
