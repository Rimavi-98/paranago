// Capa base de servicios. Hoy simula la API con mocks; cuando llegue la API
// real, SOLO se cambia este archivo (y los servicios que usan `responder`).
import type { RespuestaOk } from "../tipos";

export class ErrorApi extends Error {
  codigo: string;
  constructor(codigo: string, mensaje: string) {
    super(mensaje);
    this.codigo = codigo;
  }
}

// Controles para probar los casos feos durante el desarrollo
export const mockControl = {
  fallar: false, // true => todos los servicios devuelven un error de red
  latenciaMs: 400,
};

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Simula una respuesta de la API con la forma { datos, meta } */
export async function responder<T>(datos: T): Promise<RespuestaOk<T>> {
  await esperar(mockControl.latenciaMs);
  if (mockControl.fallar) {
    throw new ErrorApi("ERROR_DE_RED", "No pudimos conectarnos. Revisá tu conexión.");
  }
  const total = Array.isArray(datos) ? datos.length : 1;
  return { datos, meta: { total, pagina: 1, porPagina: 20 } };
}

/** Devuelve solo los datos de la respuesta */
export async function leer<T>(promesa: Promise<RespuestaOk<T>>): Promise<T> {
  const respuesta = await promesa;
  return respuesta.datos;
}
