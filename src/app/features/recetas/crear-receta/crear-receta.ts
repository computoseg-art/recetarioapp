import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { take } from 'rxjs/operators';

import { RecetaService } from '../../../core/services/receta';
import { AuthService } from '../../../core/services/auth';
import { StorageService } from '../../../core/services/storage'; // <--- 1. Importar StorageService
import { Receta } from '../../../core/models/receta';

// <--- 2. Importar Capacitor Camera
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // <--- Para el spinner de carga

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
    MatSlideToggleModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './crear-receta.html',
  styleUrl: './crear-receta.scss'
})
export class CrearReceta {
  private fb = inject(FormBuilder);
  private recetaService = inject(RecetaService);
  private authService = inject(AuthService);
  private storageService = inject(StorageService); // <--- Inyectar StorageService
  private router = inject(Router);

  categorias: string[] = ['Desayuno', 'Almuerzo', 'Cena', 'Postre', 'Snack'];

  subiendoImagen = false; // Estado de carga de la foto
  imagenPrevisualizacion: string | null = null; // Para mostrar la foto localmente al instante

  recetaForm: FormGroup = this.fb.group({
    titulo: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: ['', [Validators.required, Validators.maxLength(300)]],
    categoria: ['', Validators.required],
    tiempoPreparacionMinutos: [15, [Validators.required, Validators.min(1)]],
    porciones: [2, [Validators.required, Validators.min(1)]],
    imagenUrl: [''],
    instrucciones: ['', Validators.required],
    esPublica: [false],
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

async sacarFotoYSubir(): Promise<void> {
  try {
    const image = await Camera.getPhoto({
      quality: 60,              // Compresión moderada para que suba rápido
      width: 800,               
      height: 800,              
      allowEditing: true,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera
    });

    if (image.dataUrl) {
      this.subiendoImagen = true;
      this.imagenPrevisualizacion = image.dataUrl; // Vista previa local inmediata

      // Subimos a ImgBB y obtenemos la URL web limpia
      const urlDescarga = await this.storageService.subirImagenBase64(image.dataUrl);

      // Inyectamos la URL en el formulario de la receta
      this.recetaForm.patchValue({ imagenUrl: urlDescarga });
      console.log('Imagen subida con éxito, URL:', urlDescarga);
    }
  } catch (error: any) {
    console.error('Error con la cámara o la subida:', error);
    if (error.message !== 'User cancelled photos app') {
      alert('No se pudo procesar la foto.');
    }
    this.imagenPrevisualizacion = null;
  } finally {
    this.subiendoImagen = false;
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

    // Añadimos .catch() para ver qué error exacto arroja Firestore en la consola
    this.recetaService.agregarReceta(nuevaReceta, user.uid)
      .then(() => {
        this.router.navigate(['/']);
      })
      .catch((error) => {
        console.error('Error al guardar la receta en Firestore:', error);
        alert('Hubo un error al guardar la receta. Es probable que la imagen sea demasiado pesada.');
      });
  });
}
}