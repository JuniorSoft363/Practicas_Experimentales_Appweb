// js/storage.js — Módulo: CRUD sobre localStorage para registros del formulario

const CLAVE = 'pfc_registros';
const CLAVE_MAPA = 'pfc_ubicaciones';

/** Devuelve el array de registros guardados. */
export function obtenerRegistros() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE)) ?? [];
  } catch {
    return [];
  }
}

/** Guarda un nuevo registro. Retorna el array actualizado. */
export function guardarRegistro(datos) {
  const registros = obtenerRegistros();
  registros.push({ ...datos, id: Date.now() });
  localStorage.setItem(CLAVE, JSON.stringify(registros));
  return registros;
}

/** Elimina un registro por id. */
export function eliminarRegistro(id) {
  const actualizados = obtenerRegistros().filter(r => r.id !== id);
  localStorage.setItem(CLAVE, JSON.stringify(actualizados));
  return actualizados;
}

/** Limpia todos los registros. */
export function limpiarTodo() {
  localStorage.removeItem(CLAVE);
  return [];
}

/** Devuelve las ubicaciones del mapa guardadas. */
export function obtenerUbicaciones() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_MAPA)) ?? [];
  } catch {
    return [];
  }
}

/** Guarda una nueva ubicación del mapa. Retorna el array actualizado. */
export function guardarUbicacion(ubicacion) {
  const ubicaciones = obtenerUbicaciones();
  ubicaciones.push({ ...ubicacion, id: Date.now() });
  localStorage.setItem(CLAVE_MAPA, JSON.stringify(ubicaciones));
  return ubicaciones;
}

/** Limpia todas las ubicaciones del mapa. */
export function limpiarUbicaciones() {
  localStorage.removeItem(CLAVE_MAPA);
  return [];
}
