import { Component, inject } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { Observable, switchMap, take } from 'rxjs';
import { RecetaService } from '../../../core/services/receta';
import { AuthService } from '../../../core/services/auth';
import { Receta } from '../../../core/models/receta';
import { RecetaCard } from '../../../shared/components/receta-card/receta-card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-mis-recetas',
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    RecetaCard,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="mis-recetas-container" style="padding: 2rem; max-width: 1200px; margin: 0 auto;">
      <h1 style="margin-bottom: 1.5rem;">Mis Recetas</h1>

      @if (recetas$ | async; as recetas) {
        @if (recetas.length === 0) {
          <p>Aún no has creado ninguna receta.</p>
        } @else {
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;">
            @for (receta of recetas; track receta.id) {
              <app-receta-card [receta]="receta"></app-receta-card>
            }
          </div>
        }
      } @else {
        <div style="display: flex; justify-content: center; padding: 3rem;">
          <mat-spinner></mat-spinner>
        </div>
      }
    </div>
  `
})
export class MisRecetas {
  private recetaService = inject(RecetaService);
  private authService = inject(AuthService);

  recetas$: Observable<Receta[]> = this.authService.user$.pipe(
    switchMap(user => {
      if (!user) return [];
      return this.recetaService.getMisRecetas(user.uid);
    })
  );
}
