import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth';
import { RecetaService } from '../../core/services/receta';
import { RecetaCard } from '../../shared/components/receta-card/receta-card';
import { Observable, switchMap, of } from 'rxjs';
import { Receta } from '../../core/models/receta';

@Component({
  selector: 'app-favoritos',
  standalone: true,
  imports: [CommonModule, RecetaCard],
  templateUrl: './favoritos.html',
  styleUrl: './favoritos.scss'

})
export class FavoritosComponent {
  private authService = inject(AuthService);
  private recetaService = inject(RecetaService);

  user$ = this.authService.user$;

  favoritos$: Observable<Receta[]> = this.user$.pipe(
    switchMap(user => {
      if (!user) return of([]);
      return this.recetaService.getMisFavoritos(user.uid);
    })
  );
}
