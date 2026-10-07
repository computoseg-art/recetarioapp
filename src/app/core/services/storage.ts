import { Injectable, inject } from '@angular/core';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private storage: Storage = inject(Storage);

  async subirImagen(file: File, ruta: string): Promise<string> {
    const filePath = `${ruta}/${Date.now()}_${file.name}`;
    const storageRef = ref(this.storage, filePath);
    const result = await uploadBytes(storageRef, file);
    return await getDownloadURL(result.ref);
  }
}