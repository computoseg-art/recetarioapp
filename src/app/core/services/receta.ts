import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  Unsubscribe
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Receta } from '../models/receta';

@Injectable({
  providedIn: 'root'
})
export class RecetaService {
  private readonly firestore: Firestore = inject(Firestore);
  private readonly injector: Injector = inject(Injector);

  // Obtiene las recetas públicas en tiempo real
  getRecetasPublicas(): Observable<Receta[]> {
    return new Observable<Receta[]>(subscriber => {
      let unsubscribe: Unsubscribe;

      runInInjectionContext(this.injector, () => {
        const recetasRef = collection(this.firestore, 'recetas');

        unsubscribe = onSnapshot(
          recetasRef,
          snapshot => {
            const recetas = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Receta[];

            const publicas = recetas.filter(
              r => r.esPublica === true || r.esPublica === undefined
            );

            subscriber.next(publicas);
          },
          error => subscriber.error(error)
        );
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    });
  }

  // Obtiene las recetas del usuario logueado en tiempo real
  getMisRecetas(uid: string): Observable<Receta[]> {
    return new Observable<Receta[]>(subscriber => {
      let unsubscribe: Unsubscribe;

      runInInjectionContext(this.injector, () => {
        const recetasRef = collection(this.firestore, 'recetas');

        unsubscribe = onSnapshot(
          recetasRef,
          snapshot => {
            const recetas = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Receta[];

            const misRecetas = recetas.filter(r => r.usuarioId === uid);
            subscriber.next(misRecetas);
          },
          error => subscriber.error(error)
        );
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    });
  }

  async getRecetaPorId(id: string): Promise<Receta> {
    const recetaDocRef = doc(this.firestore, 'recetas', id);
    const snapshot = await getDoc(recetaDocRef);

    if (!snapshot.exists()) {
      throw new Error('La receta no existe');
    }

    const data = snapshot.data();
    return {
      id: snapshot.id,
      ...data,
      instrucciones:
        data['instrucciones'] ||
        (Array.isArray(data['pasos']) ? data['pasos'].join('\n') : '')
    } as Receta;
  }

  agregarReceta(receta: Receta) {
    const recetasRef = collection(this.firestore, 'recetas');
    return addDoc(recetasRef, receta);
  }

  actualizarReceta(id: string, receta: Partial<Receta>) {
    const recetaDocRef = doc(this.firestore, 'recetas', id);
    return updateDoc(recetaDocRef, receta);
  }

  eliminarReceta(id: string) {
    const recetaDocRef = doc(this.firestore, 'recetas', id);
    return deleteDoc(recetaDocRef);
  }
}
