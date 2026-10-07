import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

// Modulos de Firebase Angular
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getStorage, provideStorage } from '@angular/fire/storage';

// Tus credenciales reales de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAm-ramYmvJ1Oip3IiGiYrrxnK-ZxEAkqs",
  authDomain: "recetario-app-97a80.firebaseapp.com",
  projectId: "recetario-app-97a80",
  storageBucket: "recetario-app-97a80.firebasestorage.app",
  messagingSenderId: "810822484996",
  appId: "1:810822484996:web:dc064041f9807a8e2c2151",
  measurementId: "G-6F93X37BYZ"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage())
  ]
};