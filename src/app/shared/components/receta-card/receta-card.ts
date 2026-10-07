import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Receta } from '../../../core/models/receta';

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

  imagenPredeterminada = 'https://placehold.co/600x400?text=Sin+Imagen';

  // Limpia duplicaciones comunes en las URLs ingresadas por el usuario
  get imagenUrlSanitizada(): string {
    if (!this.receta?.imagenUrl) return this.imagenPredeterminada;

    let url = this.receta.imagenUrl.trim();

    // Corregir duplicación de protocolo como "https://https//" o "http://https://"
    if (url.startsWith('https://https//')) {
      url = url.replace('https://https//', 'https://');
    } else if (url.startsWith('http://https://')) {
      url = url.replace('http://https://', 'https://');
    } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    return url;
  }

  // Si la imagen falla al cargar (404 o dominio no resuelto), asigna la imagen de reemplazo
  manejarErrorImagen(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = this.imagenPredeterminada;
  }
}
