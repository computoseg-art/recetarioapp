import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private http = inject(HttpClient);
  private imgbbApiKey = '1d0e3140d86b3f934716141aa47d08c1';

  /**
   * Sube una imagen en formato base64 a ImgBB
   * y devuelve la URL web pública resultante.
   * @param base64String La cadena base64 completa (con o sin prefijo data_url).
   */
  async subirImagenBase64(base64String: string, path: string = 'recetas'): Promise<string> {
    try {
      // ImgBB espera el string en base64 limpio (sin el prefijo "data:image/jpeg;base64,")
      const base64Image = base64String.includes(',') 
        ? base64String.split(',')[1] 
        : base64String;

      const formData = new FormData();
      formData.append('image', base64Image);

      const url = `https://api.imgbb.com/1/upload?key=${this.imgbbApiKey}`;

      // Realizamos la petición POST usando HttpClient de Angular convertido a promesa
      const response: any = await firstValueFrom(this.http.post(url, formData));

      if (response && response.success && response.data && response.data.url) {
        console.log('Imagen subida con éxito a ImgBB:', response.data.url);
        return response.data.url;
      } else {
        throw new Error('La respuesta de ImgBB no devolvió una URL válida.');
      }
    } catch (error) {
      console.error('Error al subir la imagen a ImgBB:', error);
      throw error;
    }
  }
}