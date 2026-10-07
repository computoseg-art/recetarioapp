import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { RecetaService } from '../../../core/services/receta';
import { Receta } from '../../../core/models/receta';
import { RecetaCard } from '../../../shared/components/receta-card/receta-card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-lista-recetas',
  standalone: true,
  imports: [
    AsyncPipe,
    RecetaCard,
    MatProgressSpinnerModule,
    MatButtonModule
  ],
  templateUrl: './lista-recetas.html',
  styleUrl: './lista-recetas.scss'
})
export class ListaRecetas {
  private recetaService = inject(RecetaService);

  // Consume solo las recetas con esPublica == true
  recetas$: Observable<Receta[]> = this.recetaService.getRecetasPublicas();

  crearRecetaDemo(): void {
    const recetaDemo: Receta = {
      titulo: 'Tacos al Pastor Caseros',
      descripcion: 'Deliciosos tacos de cerdo marinados con achiote, piña asada y cilantro fresco.',
      categoria: 'Cena',
      tiempoPreparacionMinutos: 45,
      porciones: 4,
      imagenUrl: 'https://placehold.co/600x400?text=Tacos+al+Pastor',
      ingredientes: ['500g Carne de cerdo', '100g Achiote', '1 Piña fresca', 'Cilantro y cebolla'],
      instrucciones: '1. Marinar la carne con achiote.\n2. Asar la carne y la piña.\n3. Servir en tortillas calientes.',
      esPublica: true // Se crea como pública para que aparezca en el feed
    };

    this.recetaService.agregarReceta(recetaDemo);
  }
}
