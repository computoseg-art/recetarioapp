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

async getRecetaPorId(
  id: string,
  uid?: string,
  uidProvider?: () => Promise<string | undefined>
): Promise<Receta> {
    console.log('>>> [Servicio] getRecetaPorId llamado con ID:', id, 'UID:', uid);

    return runInInjectionContext(this.injector, async () => {
      try {
        const publicaRef = doc(this.firestore, 'recetas_publicas', id);
        const publicaSnapPromise = getDoc(publicaRef);

        if (uid) {
          const privadaRef = doc(this.firestore, 'usuarios', uid, 'recetas', id);
          const [privadaSnap, publicaSnap] = await Promise.all([
            getDoc(privadaRef),
            publicaSnapPromise
          ]);

          if (privadaSnap.exists()) {
            return { id: privadaSnap.id, ...privadaSnap.data() } as Receta;
          }

          if (publicaSnap.exists()) {
            return { id: publicaSnap.id, ...publicaSnap.data() } as Receta;
          }
        } else {
          const publicaSnap = await publicaSnapPromise;
          if (publicaSnap.exists()) {
            return { id: publicaSnap.id, ...publicaSnap.data() } as Receta;
          }

          const uidResuelto = await uidProvider?.();
          if (uidResuelto) {
            const privadaRef = doc(this.firestore, 'usuarios', uidResuelto, 'recetas', id);
            const privadaSnap = await getDoc(privadaRef);
            if (privadaSnap.exists()) {
              return { id: privadaSnap.id, ...privadaSnap.data() } as Receta;
            }
          }
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
  async toggleFavorito(receta: Receta, uid: string, esFavorito: boolean): Promise<void> {
    if (!receta.id) {
      throw new Error('No se puede actualizar el favorito de una receta sin ID.');
    }

    return runInInjectionContext(this.injector, async () => {
      const publicaRef = doc(this.firestore, 'recetas_publicas', receta.id!);
      const publicaSnap = await getDoc(publicaRef);
      const recetaRef = publicaSnap.exists()
        ? publicaRef
        : doc(this.firestore, 'usuarios', receta.usuarioId ?? uid, 'recetas', receta.id!);
      const cambios = esFavorito
        ? { favoritosPor: arrayRemove(uid) }
        : { favoritosPor: arrayUnion(uid) };

      await updateDoc(recetaRef, cambios);
    });
  }
// Obtener mis recetas favoritas (usando onSnapshot para evitar conflictos de instancia)
  getMisFavoritos(uid: string): Observable<Receta[]> {
    return new Observable<Receta[]>(subscriber => {
      let unsubscribePublicas: Unsubscribe | undefined;
      let unsubscribePrivadas: Unsubscribe | undefined;
      let favoritasPublicas: Receta[] = [];
      let favoritasPrivadas: Receta[] = [];

      const emitirFavoritos = (): void => {
        const recetasPorId = new Map<string, Receta>();
        [...favoritasPrivadas, ...favoritasPublicas].forEach(receta => {
          if (receta.id) recetasPorId.set(receta.id, receta);
        });
        subscriber.next([...recetasPorId.values()]);
      };

      runInInjectionContext(this.injector, () => {
        const publicasRef = collection(this.firestore, 'recetas_publicas');
        const publicasQuery = query(publicasRef, where('favoritosPor', 'array-contains', uid));
        const privadasRef = collection(this.firestore, 'usuarios', uid, 'recetas');
        const privadasQuery = query(privadasRef, where('favoritosPor', 'array-contains', uid));

        unsubscribePublicas = onSnapshot(
          publicasQuery,
          snapshot => {
            favoritasPublicas = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Receta[];
            emitirFavoritos();
          },
          error => subscriber.error(error)
        );

        unsubscribePrivadas = onSnapshot(
          privadasQuery,
          snapshot => {
            favoritasPrivadas = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Receta[];
            emitirFavoritos();
          },
          error => subscriber.error(error)
        );
      });

      return () => {
        unsubscribePublicas?.();
        unsubscribePrivadas?.();
      };
    });
  }
  }
