export interface Receta {
  id?: string;
  titulo: string;
  descripcion: string;
  categoria?: string;
  tiempoPreparacionMinutos?: number;
  porciones?: number;
  ingredientes?: string[];
  instrucciones?: string;
  imagenUrl?: string;
  usuarioId?: string; // ID del usuario dueño de la receta
  esPublica?: boolean; // true = visible para todos, false = solo para el dueño
  favoritosPor?: string[];
}
