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
  getRedirectResult,
  onAuthStateChanged
} from '@angular/fire/auth';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private auth: Auth = inject(Auth);
  private injector: Injector = inject(Injector);
  private zone: NgZone = inject(NgZone);

  private currentUserSubject = new BehaviorSubject<any>(null);
  user$: Observable<any> = this.currentUserSubject.asObservable();

  constructor() {
    console.log('[AuthService] Inicializando servicio de autenticación...');

    runInInjectionContext(this.injector, () => {
      onAuthStateChanged(this.auth, (user) => {
        console.log('[AuthService] onAuthStateChanged disparado:', user ? `Usuario logueado: ${user.email}` : 'No hay usuario activo');
        this.zone.run(() => {
          this.currentUserSubject.next(user);
        });
      });
    });

    this.procesarResultadoRedireccion();
  }

  private async procesarResultadoRedireccion(): Promise<void> {
    console.log('[AuthService] Verificando getRedirectResult() (retorno de móvil)...');
    try {
      const result = await runInInjectionContext(this.injector, () => getRedirectResult(this.auth));
      if (result?.user) {
        console.log('[AuthService] ✅ ¡Redirect exitoso! Usuario recuperado:', result.user);
        this.zone.run(() => {
          this.currentUserSubject.next(result.user);
        });
      } else {
        console.log('[AuthService] getRedirectResult() no devolvió usuario (es una carga normal o popup).');
      }
    } catch (error) {
      console.error('[AuthService] ❌ Error crítico en getRedirectResult():', error);
    }
  }

  registro(email: string, pass: string) {
    console.log('[AuthService] Intentando registro por email:', email);
    return runInInjectionContext(this.injector, () =>
      createUserWithEmailAndPassword(this.auth, email, pass)
    );
  }

  login(email: string, pass: string) {
    console.log('[AuthService] Intentando login por email:', email);
    return runInInjectionContext(this.injector, () =>
      signInWithEmailAndPassword(this.auth, email, pass)
    );
  }

  async loginConGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    console.log('[AuthService] Ejecutando signInWithPopup (compatible con móviles modernos)...');

    return runInInjectionContext(this.injector, () => {
      return signInWithPopup(this.auth, provider).then((result) => {
        if (result?.user) {
          console.log('[AuthService] Popup de Google exitoso:', result.user.email);
          this.zone.run(() => {
            this.currentUserSubject.next(result.user);
          });
        }
      }).catch((error) => {
        console.error('[AuthService] ❌ Error en signInWithPopup:', error);
        throw error;
      });
    });
  }

  logout() {
    console.log('[AuthService] Cerrando sesión...');
    return runInInjectionContext(this.injector, () =>
      signOut(this.auth).then(() => {
        console.log('[AuthService] Sesión cerrada correctamente.');
        this.zone.run(() => {
          this.currentUserSubject.next(null);
        });
      })
    );
  }
}
