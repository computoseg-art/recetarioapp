import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { RecetaService } from '../../../core/services/receta';
import { Receta } from '../../../core/models/receta';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-editar-receta',
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
    MatProgressSpinnerModule
  ],
  templateUrl: './editar-receta.html',
  styleUrl: './editar-receta.scss'
})
export class EditarReceta implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private recetaService = inject(RecetaService);

  recetaId: string = '';
  cargando: boolean = true;
  categorias: string[] = ['Desayuno', 'Almuerzo', 'Cena', 'Postre', 'Snack'];

  recetaForm: FormGroup = this.fb.group({
    titulo: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: ['', [Validators.required, Validators.maxLength(300)]],
    categoria: ['', Validators.required],
    tiempoPreparacionMinutos: [15, [Validators.required, Validators.min(1)]],
    porciones: [2, [Validators.required, Validators.min(1)]],
    imagenUrl: [''],
    instrucciones: ['', Validators.required],
    ingredientes: this.fb.array([])
  });

  get ingredientes(): FormArray {
    return this.recetaForm.get('ingredientes') as FormArray;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.recetaId = id;
      this.cargarReceta(id);
    } else {
      this.router.navigate(['/']);
    }
  }

  cargarReceta(id: string): void {
    this.recetaService.getRecetaPorId(id).then(receta => {
      this.recetaForm.patchValue({
        titulo: receta.titulo,
        descripcion: receta.descripcion,
        categoria: receta.categoria,
        tiempoPreparacionMinutos: receta.tiempoPreparacionMinutos,
        porciones: receta.porciones,
        imagenUrl: receta.imagenUrl,
        instrucciones: receta.instrucciones
      });

      // Mapear ingredientes existentes al FormArray
      if (receta.ingredientes && receta.ingredientes.length > 0) {
        receta.ingredientes.forEach(ing => {
          const textoIngrediente = typeof ing === 'string' ? ing : (ing as any).nombre || '';
          this.ingredientes.push(this.crearIngredienteControl(textoIngrediente));
        });
      } else {
        this.agregarIngrediente();
      }

      this.cargando = false;
    }).catch(error => {
      console.error('Error al cargar la receta:', error);
      this.router.navigate(['/']);
    });
  }

  crearIngredienteControl(valor: string = ''): FormGroup {
    return this.fb.group({
      texto: [valor, Validators.required]
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

  actualizarReceta(): void {
    if (this.recetaForm.invalid) {
      this.recetaForm.markAllAsTouched();
      return;
    }

    const formValue = this.recetaForm.value;

    const listaIngredientes: string[] = formValue.ingredientes
      .map((i: { texto: string }) => i.texto ? i.texto.trim() : '')
      .filter((texto: string) => texto.length > 0);

    const recetaActualizada: Partial<Receta> = {
      titulo: formValue.titulo,
      descripcion: formValue.descripcion,
      categoria: formValue.categoria,
      tiempoPreparacionMinutos: Number(formValue.tiempoPreparacionMinutos),
      porciones: Number(formValue.porciones),
      imagenUrl: formValue.imagenUrl || 'https://placehold.co/600x400?text=Sin+Imagen',
      instrucciones: formValue.instrucciones,
      ingredientes: listaIngredientes
    };

    this.recetaService.actualizarReceta(this.recetaId, recetaActualizada).then(() => {
      this.router.navigate(['/receta', this.recetaId]);
    });
  }
}
