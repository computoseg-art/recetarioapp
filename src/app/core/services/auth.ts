import { Injectable, inject, Injector, NgZone, runInInjectionContext } from '@angular/core';
import {
  Auth,
  user,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private auth: Auth = inject(Auth);
  private injector: Injector = inject(Injector);
  private zone: NgZone = inject(NgZone);

  // Observable global con el estado del usuario
  user$: Observable<any> = user(this.auth);

  constructor() {
    this.procesarResultadoRedireccion();
  }

  private async procesarResultadoRedireccion(): Promise<void> {
    try {
      const result = await runInInjectionContext(this.injector, () => getRedirectResult(this.auth));
      if (result?.user) {
        console.log('Usuario autenticado con éxito tras redirección:', result.user);
        // Ejecutamos dentro de NgZone para asegurar que la vista de Angular se actualice
        this.zone.run(() => {
          // Si tienes algún Signal, Subject o redirección adicional, agrégala aquí
        });
      }
    } catch (error) {
      console.error('Error al procesar el resultado de la redirección:', error);
    }
  }

  // Registro con Correo y Contraseña
  registro(email: string, pass: string) {
    return runInInjectionContext(this.injector, () =>
      createUserWithEmailAndPassword(this.auth, email, pass)
    );
  }

  // Login con Correo y Contraseña
  login(email: string, pass: string) {
    return runInInjectionContext(this.injector, () =>
      signInWithEmailAndPassword(this.auth, email, pass)
    );
  }

  // Login con Google
  async loginConGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    const esMovil = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    return runInInjectionContext(this.injector, () => {
      if (esMovil) {
        return signInWithRedirect(this.auth, provider);
      } else {
        return signInWithPopup(this.auth, provider).then(() => {});
      }
    });
  }

  // Cerrar Sesión
  logout() {
    return runInInjectionContext(this.injector, () =>
      signOut(this.auth)
    );
  }
}
