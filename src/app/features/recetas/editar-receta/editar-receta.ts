import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom, take } from 'rxjs';

import { RecetaService } from '../../../core/services/receta';
import { AuthService } from '../../../core/services/auth';
import { StorageService } from '../../../core/services/storage';
import { Receta } from '../../../core/models/receta';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';

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
    MatProgressSpinnerModule,
    ImageCropperComponent
  ],
  templateUrl: './editar-receta.html',
  styleUrl: './editar-receta.scss'
})
export class EditarReceta implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private recetaService = inject(RecetaService);
  private authService = inject(AuthService);
  private storageService = inject(StorageService);


  recetaId: string = '';
  cargando: boolean = true;
  subiendoImagen = false;
  archivoParaRecortar: File | null = null;
  imagenRecortada: Blob | null = null;
  imagenPrevisualizacion: string | null = null;
  private imagenPrevisualizacionObjectUrl: string | null = null;
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

    if (!this.recetaId) {
      this.cargando = false;
      this.router.navigate(['/']);
      return;
    }

    const uidProvider = () =>
      firstValueFrom(this.authService.user$.pipe(take(1)))
        .then(user => user?.uid);

    this.recetaService.getRecetaPorId(this.recetaId, undefined, uidProvider)
      .then((receta: Receta) => {
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
        console.error('No se pudo cargar la receta para editar:', error);
        alert('No se pudo encontrar la receta.');
        this.router.navigate(['/']);
      })
      .finally(() => {
        this.cargando = false;
        this.cdr.detectChanges();
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

  async sacarFotoYSubir(): Promise<void> {
    this.subiendoImagen = true;
    try {
      const image = await Camera.getPhoto({
        quality: 55,
        width: 600,
        height: 450,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      if (!image.dataUrl) {
        throw new Error('La cámara no devolvió una imagen.');
      }

      const imagen = await fetch(image.dataUrl).then(response => response.blob());
      await this.subirImagen(imagen);
    } catch (error) {
      console.error('Error al tomar o subir la foto:', error);
      if (!this.esCancelacion(error)) {
        alert('No se pudo procesar la foto. Inténtalo de nuevo.');
      }
    } finally {
      this.subiendoImagen = false;
    }
  }

  seleccionarImagen(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;

    input.value = '';
    if (!archivo.type.startsWith('image/')) {
      alert('Selecciona un archivo de imagen válido.');
      return;
    }

    this.archivoParaRecortar = archivo;
    this.imagenRecortada = null;
  }

  guardarImagenRecortada(): void {
    if (!this.imagenRecortada || this.subiendoImagen) return;

    this.subiendoImagen = true;
    this.subirImagen(this.imagenRecortada)
      .then(() => this.cancelarRecorte())
      .catch(error => {
        console.error('Error al subir la imagen recortada:', error);
        alert('No se pudo subir la imagen. Inténtalo de nuevo.');
      })
      .finally(() => {
        this.subiendoImagen = false;
      });
  }

  alRecortarImagen(event: ImageCroppedEvent): void {
    this.imagenRecortada = event.blob ?? null;
  }

  cancelarRecorte(): void {
    this.archivoParaRecortar = null;
    this.imagenRecortada = null;
  }

  falloCargaRecorte(): void {
    this.cancelarRecorte();
    alert('No se pudo abrir esta imagen para recortarla.');
  }

  private async subirImagen(imagen: Blob): Promise<void> {
    const vistaPreviaAnterior = this.imagenPrevisualizacion;
    const objectUrlAnterior = this.imagenPrevisualizacionObjectUrl;
    const objectUrlNuevo = URL.createObjectURL(imagen);
    this.imagenPrevisualizacion = objectUrlNuevo;
    this.imagenPrevisualizacionObjectUrl = objectUrlNuevo;

    try {
      const urlDescarga = await this.storageService.subirImagen(imagen);
      this.recetaForm.patchValue({ imagenUrl: urlDescarga });
      if (objectUrlAnterior) URL.revokeObjectURL(objectUrlAnterior);
    } catch (error) {
      URL.revokeObjectURL(objectUrlNuevo);
      this.imagenPrevisualizacion = vistaPreviaAnterior;
      this.imagenPrevisualizacionObjectUrl = objectUrlAnterior;
      throw error;
    }
  }

  ngOnDestroy(): void {
    if (this.imagenPrevisualizacionObjectUrl) {
      URL.revokeObjectURL(this.imagenPrevisualizacionObjectUrl);
    }
  }

  private esCancelacion(error: unknown): boolean {
    return error instanceof Error && error.message.toLowerCase().includes('cancel');
  }

  actualizarReceta(): void {
    if (this.recetaForm.invalid || this.subiendoImagen || this.archivoParaRecortar) {
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
