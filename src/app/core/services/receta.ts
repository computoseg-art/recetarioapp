import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  Unsubscribe,
  arrayUnion,
  arrayRemove,
  collectionData,
  query,
  where
} from '@angular/fire/firestore';

import { Observable } from 'rxjs';
import { Receta } from '../models/receta';

@Injectable({
  providedIn: 'root'
})
export class RecetaService {

  private firestore = inject(Firestore);
  // private readonly firestore: Firestore = inject(Firestore);
  private readonly injector: Injector = inject(Injector);

  // Obtener las recetas del feed público global
  getRecetasPublicas(): Observable<Receta[]> {
    return new Observable<Receta[]>(subscriber => {
      let unsubscribe: Unsubscribe;

      runInInjectionContext(this.injector, () => {
        const publicasRef = collection(this.firestore, 'recetas_publicas');

        unsubscribe = onSnapshot(
          publicasRef,
          snapshot => {
            const recetas = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Receta[];

            subscriber.next(recetas);
          },
          error => subscriber.error(error)
        );
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    });
  }

  // Obtener las recetas exclusivas de la subcolección del usuario
  getMisRecetas(uid: string): Observable<Receta[]> {
    return new Observable<Receta[]>(subscriber => {
      let unsubscribe: Unsubscribe;

      runInInjectionContext(this.injector, () => {
        const misRecetasRef = collection(this.firestore, 'usuarios', uid, 'recetas');

        unsubscribe = onSnapshot(
          misRecetasRef,
          snapshot => {
            const recetas = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Receta[];

            subscriber.next(recetas);
          },
          error => subscriber.error(error)
        );
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    });
  }

async getRecetaPorId(id: string, uid?: string): Promise<Receta> {
    console.log('>>> [Servicio] getRecetaPorId llamado con ID:', id, 'UID:', uid);

    return runInInjectionContext(this.injector, async () => {
      try {
        if (uid) {
          console.log('>>> [Servicio] Buscando en subcolección privada...');
          const privadaRef = doc(this.firestore, 'usuarios', uid, 'recetas', id);
          const privadaSnap = await getDoc(privadaRef);

          if (privadaSnap.exists()) {
            console.log('>>> [Servicio] ¡Encontrada en privada!');
            return { id: privadaSnap.id, ...privadaSnap.data() } as Receta;
          }
        }

        console.log('>>> [Servicio] Buscando en recetas_publicas...');
        const publicaRef = doc(this.firestore, 'recetas_publicas', id);
        const publicaSnap = await getDoc(publicaRef);

        if (publicaSnap.exists()) {
          console.log('>>> [Servicio] ¡Encontrada en pública!');
          return { id: publicaSnap.id, ...publicaSnap.data() } as Receta;
        }

        throw new Error('La receta no existe en ninguna colección.');
      } catch (err) {
        console.error('>>> [Servicio] Error atrapado en getRecetaPorId:', err);
        throw err;
      }
    });
  }

  // Guardar nueva receta
  agregarReceta(receta: Receta, uid: string) {
    return runInInjectionContext(this.injector, async () => {
      const nuevaRecetaRef = doc(collection(this.firestore, 'usuarios', uid, 'recetas'));
      const idGenerado = nuevaRecetaRef.id;

      const datosReceta: Receta = {
        ...receta,
        id: idGenerado,
        usuarioId: uid
      };

      await setDoc(nuevaRecetaRef, datosReceta);

      if (receta.esPublica) {
        const publicaRef = doc(this.firestore, 'recetas_publicas', idGenerado);
        await setDoc(publicaRef, datosReceta);
      }
    });
  }

  // Actualizar receta
async actualizarReceta(id: string, recetaData: Partial<Receta>, uid: string): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      try {
        // 1. Referencia a la receta en la subcolección privada del usuario
        const privadaRef = doc(this.firestore, 'usuarios', uid, 'recetas', id);

        // Actualizamos los datos privados
        await updateDoc(privadaRef, {
          ...recetaData,
          actualizadoEn: new Date()
        });

        // 2. Manejo de visibilidad pública
        const publicaRef = doc(this.firestore, 'recetas_publicas', id);
        const publicaSnap = await getDoc(publicaRef);

        if (recetaData.esPublica) {
          // Si ahora es pública, la guardamos o actualizamos en 'recetas_publicas'
          await setDoc(publicaRef, {
            id,
            ...recetaData,
            uidPropietario: uid,
            actualizadoEn: new Date()
          }, { merge: true });
        } else {
          // Si el usuario la desmarcó como pública, la eliminamos de 'recetas_publicas'
          if (publicaSnap.exists()) {
            await deleteDoc(publicaRef);
          }
        }

        console.log('Receta actualizada y sincronizada correctamente.');
      } catch (err) {
        console.error('Error al actualizar la receta en Firestore:', err);
        throw err;
      }
    });
  }

  // Eliminar receta
  eliminarReceta(id: string, uid: string) {
    return runInInjectionContext(this.injector, async () => {
      const recetaRef = doc(this.firestore, 'usuarios', uid, 'recetas', id);
      const publicaRef = doc(this.firestore, 'recetas_publicas', id);

      await deleteDoc(recetaRef);
      await deleteDoc(publicaRef).catch(() => {});
    });
  }

  // 1. Alternar Favorito (Agregar / Quitar)
// async toggleFavorito(recetaId: string, uid: string, esFavorito: boolean): Promise<void> {
//   // ATENCIÓN: Usar 'recetas_publicas' para que coincida con tus reglas de Firestore
//   const recetaRef = doc(this.firestore, `recetas_publicas/${recetaId}`);

//   if (esFavorito) {
//     await updateDoc(recetaRef, {
//       favoritosPor: arrayRemove(uid)
//     });
//   } else {
//     await updateDoc(recetaRef, {
//       favoritosPor: arrayUnion(uid)
//     });
//   }
// }
async toggleFavorito(recetaId: string, uid: string, esFavorito: boolean): Promise<void> {
    const recetaRef = doc(this.firestore, `recetas_publicas/${recetaId}`);
    if (esFavorito) {
      await updateDoc(recetaRef, { favoritosPor: arrayRemove(uid) });
    } else {
      await updateDoc(recetaRef, { favoritosPor: arrayUnion(uid) });
    }
  }
// Obtener mis recetas favoritas (usando onSnapshot para evitar conflictos de instancia)
  getMisFavoritos(uid: string): Observable<Receta[]> {
    return new Observable<Receta[]>(subscriber => {
      let unsubscribe: Unsubscribe;

      runInInjectionContext(this.injector, () => {
        const publicasRef = collection(this.firestore, 'recetas_publicas');
        const q = query(publicasRef, where('favoritosPor', 'array-contains', uid));

        unsubscribe = onSnapshot(
          q,
          snapshot => {
            const recetas = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Receta[];

            subscriber.next(recetas);
          },
          error => subscriber.error(error)
        );
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    });
  }
  }
