import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Receta } from '../../../core/models/receta';
import { RecetaService } from '../../../core/services/receta';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

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
  @Input() usuarioActualId: string | null = null;

  private recetaService = inject(RecetaService);

  imagenPredeterminada = 'https://placehold.co/600x400?text=Sin+Imagen';

  // Evalúa si la receta está en favoritos del usuario
  get esFavorito(): boolean {
    return !!(
      this.receta?.favoritosPor &&
      this.usuarioActualId &&
      this.receta.favoritosPor.includes(this.usuarioActualId)
    );
  }

  // Cambia el estado de favorito de forma inmediata
  async toggleFavorito(event: Event): Promise<void> {
    event.stopPropagation();

    if (!this.usuarioActualId) {
      alert('Debes iniciar sesión para guardar favoritos.');
      return;
    }

    if (!this.receta?.id) return;

    // 1. Asegurar que el array exista localmente
    if (!this.receta.favoritosPor) {
      this.receta.favoritosPor = [];
    }

    const estadoAnterior = this.esFavorito;

    // 2. ACTUALIZACIÓN LOCAL INMEDIATA (Optimista)
    if (estadoAnterior) {
      // Quitar del array local
      this.receta.favoritosPor = this.receta.favoritosPor.filter(uid => uid !== this.usuarioActualId);
    } else {
      // Agregar al array local
      this.receta.favoritosPor.push(this.usuarioActualId);
    }

    // 3. ENVIAR A FIRESTORE
    try {
      await this.recetaService.toggleFavorito(
        this.receta.id,
        this.usuarioActualId,
        estadoAnterior
      );
    } catch (error) {
      console.error('Error al guardar favorito en Firestore:', error);
      // Si falla en la base de datos, revertir el cambio local
      if (estadoAnterior) {
        this.receta.favoritosPor.push(this.usuarioActualId);
      } else {
        this.receta.favoritosPor = this.receta.favoritosPor.filter(uid => uid !== this.usuarioActualId);
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
