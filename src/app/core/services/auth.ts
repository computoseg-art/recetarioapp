import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import {
  Auth,
  user,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {


  private auth: Auth = inject(Auth);
  private injector: Injector = inject(Injector);

  // Observable con el estado del usuario en tiempo real
  user$ = user(this.auth);

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
  loginConGoogle() {
    return runInInjectionContext(this.injector, () => {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      return signInWithPopup(this.auth, provider);
    });
  }

  // Cerrar Sesión
  logout() {
    return runInInjectionContext(this.injector, () =>
      signOut(this.auth)
    );
  }
}
