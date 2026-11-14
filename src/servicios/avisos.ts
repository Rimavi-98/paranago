import type { Aviso } from "../tipos";
import { ErrorApi } from "./api";
import { conCache } from "./cache";
import { pedirLista } from "./http";
import { notificarAvisosNuevos } from "./notificaciones";

// La API de la cátedra no trae video en los avisos. Para poder mostrar el reproductor,
// si ninguno lo trae, el primero usa un video público de prueba.
const VIDEO_DE_PRUEBA = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

// Los avisos cambian todos los días: se guardan la última vez, y si no hay red
// se muestran con el cartel de "información desactualizada".
export async function obtenerAvisos(): Promise<Aviso[]> {
  const avisos = await conCache("avisos", () => pedirLista<Aviso>("/avisos", { porPagina: 100 }));
  if (avisos.length > 0 && !avisos.some((a) => a.videoUrl)) {
    return avisos.map((a, i) => (i === 0 ? { ...a, videoUrl: VIDEO_DE_PRUEBA } : a));
  }
  return avisos;
}

/** Trae los avisos y notifica los nuevos de líneas favoritas. */
export async function obtenerAvisosYNotificar(): Promise<Aviso[]> {
  const avisos = await obtenerAvisos();
  await notificarAvisosNuevos(avisos);
  return avisos;
}

export async function obtenerAviso(id: string): Promise<Aviso> {
  const aviso = (await obtenerAvisos()).find((a) => a.id === id);
  if (!aviso) throw new ErrorApi("AVISO_NO_ENCONTRADO", "No existe ese aviso.");
  return aviso;
}

export async function obtenerAvisosDeLinea(lineaId: string): Promise<Aviso[]> {
  return (await obtenerAvisos()).filter((a) => a.lineaIds.includes(lineaId));
}
