import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface ImgBBUploadResponse {
  success: boolean;
  data?: {
    url?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private http = inject(HttpClient);
  private imgbbApiKey = '1d0e3140d86b3f934716141aa47d08c1';

  async subirImagen(imagen: Blob): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('image', imagen, 'receta.jpg');

      const url = `https://api.imgbb.com/1/upload?key=${this.imgbbApiKey}`;
      const response = await firstValueFrom(
        this.http.post<ImgBBUploadResponse>(url, formData)
      );
      const imageUrl = response.data?.url;

      if (!response.success || !imageUrl) {
        throw new Error('La respuesta de ImgBB no devolvió una URL válida.');
      }

      return imageUrl;
    } catch (error) {
      console.error('Error al subir la imagen a ImgBB:', error);
      throw error;
    }
  }
}