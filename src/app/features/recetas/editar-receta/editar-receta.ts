import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
    MatSlideToggleModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './editar-receta.html',
  styleUrl: './editar-receta.scss'
})
export class EditarReceta implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private recetaService = inject(RecetaService);
  private authService = inject(AuthService);


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
    esPublica: [false],
    ingredientes: this.fb.array([])
  });

  get ingredientes(): FormArray {
    return this.recetaForm.get('ingredientes') as FormArray;
  }

ngOnInit(): void {
    this.recetaId = this.route.snapshot.paramMap.get('id') || '';
    console.log('>>> [Componente] ngOnInit iniciado. ID de ruta:', this.recetaId);

    if (!this.recetaId) {
      console.log('>>> [Componente] No hay ID, redirigiendo...');
      this.cargando = false;
      this.router.navigate(['/']);
      return;
    }

    console.log('>>> [Componente] Suscribiéndose a authService.user$...');
    this.authService.user$.pipe(take(1)).subscribe({
      next: (user) => {
        console.log('>>> [Componente] Usuario emitido por authService:', user?.uid);

        this.recetaService.getRecetaPorId(this.recetaId, user?.uid)
          .then((receta: Receta) => {
            console.log('>>> [Componente] Receta obtenida con éxito:', receta);

            this.recetaForm.patchValue({
              titulo: receta.titulo,
              descripcion: receta.descripcion,
              categoria: receta.categoria,
              tiempoPreparacionMinutos: receta.tiempoPreparacionMinutos,
              porciones: receta.porciones,
              imagenUrl: receta.imagenUrl,
              instrucciones: receta.instrucciones,
              esPublica: receta.esPublica
            });

            this.ingredientes.clear();
            if (receta.ingredientes && Array.isArray(receta.ingredientes)) {
              receta.ingredientes.forEach((ing: unknown) => {
                const textoIng = typeof ing === 'string'
                  ? ing
                  : (ing && typeof ing === 'object' && 'nombre' in ing) ? (ing as { nombre: string }).nombre : '';
                this.ingredientes.push(this.fb.group({ texto: [textoIng, Validators.required] }));
              });
            }
          })
          .catch((error: unknown) => {
            console.error('>>> [Componente] Error en promesa getRecetaPorId:', error);
            alert('No se pudo encontrar la receta.');
            this.router.navigate(['/']);
          })
      .finally(() => {
            console.log('>>> [Componente] Bloque finally ejecutado. Apagando spinner.');
            this.cargando = false;
            this.cdr.detectChanges(); // Fuerza a Angular a repintar la vista y ocultar el spinner
          });
      },
      error: (err) => {
        console.error('>>> [Componente] Error en observable de usuario:', err);
        this.cargando = false;
        this.router.navigate(['/']);
      }
    });
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

  actualizarReceta(): void {
    if (this.recetaForm.invalid) {
      this.recetaForm.markAllAsTouched();
      return;
    }

    this.authService.user$.pipe(take(1)).subscribe(user => {
      if (!user) return;

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
        imagenUrl: formValue.imagenUrl,
        instrucciones: formValue.instrucciones,
        ingredientes: listaIngredientes,
        esPublica: !!formValue.esPublica
      };

      this.recetaService.actualizarReceta(this.recetaId, recetaActualizada, user.uid).then(() => {
        this.router.navigate(['/detalle', this.recetaId]);
      });
    });
  }
}
