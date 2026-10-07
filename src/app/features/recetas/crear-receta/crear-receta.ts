import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { take } from 'rxjs/operators';

import { RecetaService } from '../../../core/services/receta';
import { AuthService } from '../../../core/services/auth';
import { Receta } from '../../../core/models/receta';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-crear-receta',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule
  ],
  templateUrl: './crear-receta.html',
  styleUrl: './crear-receta.scss'
})
export class CrearReceta {
  private fb = inject(FormBuilder);
  private recetaService = inject(RecetaService);
  private authService = inject(AuthService);
  private router = inject(Router);

  categorias: string[] = ['Desayuno', 'Almuerzo', 'Cena', 'Postre', 'Snack'];

  recetaForm: FormGroup = this.fb.group({
    titulo: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: ['', [Validators.required, Validators.maxLength(300)]],
    categoria: ['', Validators.required],
    tiempoPreparacionMinutos: [15, [Validators.required, Validators.min(1)]],
    porciones: [2, [Validators.required, Validators.min(1)]],
    imagenUrl: [''],
    instrucciones: ['', Validators.required],
    esPublica: [false], // Control para visibilidad
    ingredientes: this.fb.array([this.crearIngredienteControl()])
  });

  get ingredientes(): FormArray {
    return this.recetaForm.get('ingredientes') as FormArray;
  }

  crearIngredienteControl(): FormGroup {
    return this.fb.group({
      texto: ['', Validators.required]
    });
  }

  agregarIngrediente(): void {
    this.ingredientes.push(this.crearIngredienteControl());
  }

  eliminarIngrediente(index: number): void {
    if (this.ingredientes.length > 1) {
      this.ingredientes.removeAt(index);
    }
  }

  guardarReceta(): void {
  if (this.recetaForm.invalid) {
    this.recetaForm.markAllAsTouched();
    return;
  }

  this.authService.user$.pipe(take(1)).subscribe(user => {
    if (!user) {
      alert('Debes iniciar sesión para crear y guardar tus recetas.');
      return;
    }

    const formValue = this.recetaForm.value;

    const listaIngredientes: string[] = formValue.ingredientes
      .map((i: { texto: string }) => i.texto ? i.texto.trim() : '')
      .filter((texto: string) => texto.length > 0);

    const nuevaReceta: Receta = {
      titulo: formValue.titulo,
      descripcion: formValue.descripcion,
      categoria: formValue.categoria,
      tiempoPreparacionMinutos: Number(formValue.tiempoPreparacionMinutos),
      porciones: Number(formValue.porciones),
      imagenUrl: formValue.imagenUrl || 'https://placehold.co/600x400?text=Sin+Imagen',
      instrucciones: formValue.instrucciones,
      ingredientes: listaIngredientes,
      usuarioId: user.uid,
      esPublica: !!formValue.esPublica
    };

    // Pasa la receta y el UID del usuario
    this.recetaService.agregarReceta(nuevaReceta, user.uid).then(() => {
      this.router.navigate(['/']);
    });
  });
}
}
