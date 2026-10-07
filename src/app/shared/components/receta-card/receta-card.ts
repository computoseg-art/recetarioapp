import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Receta } from '../../../core/models/receta';

@Component({
  selector: 'app-receta-card',
  standalone: true,
  imports: [
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
  @Input() receta!: Receta;
}
