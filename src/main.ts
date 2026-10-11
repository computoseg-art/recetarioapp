import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Importar PWA Elements
import { defineCustomElements } from '@ionic/pwa-elements/loader';

// Llamar a la función antes de bootstrap
defineCustomElements(window);

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
