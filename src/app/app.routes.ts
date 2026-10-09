import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/recetas/lista-recetas/lista-recetas').then(m => m.ListaRecetas)
  },
  {
    path: 'crear-receta',
    loadComponent: () => import('./features/recetas/crear-receta/crear-receta').then(m => m.CrearReceta)
  },
  {
    path: 'receta/:id',
    loadComponent: () => import('./features/recetas/detalle-receta/detalle-receta').then(m => m.DetalleReceta)
  },
  {
    path: 'editar-receta/:id',
    loadComponent: () => import('./features/recetas/editar-receta/editar-receta').then(m => m.EditarReceta)
  },
  {
    path: 'mis-recetas',
    loadComponent: () => import('./features/recetas/mis-recetas/mis-recetas').then(m => m.MisRecetas)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'favoritos',
    loadComponent: () => import('./features/favoritos/favoritos').then(m => m.FavoritosComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
