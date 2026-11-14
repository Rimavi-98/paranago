import type { Aviso, Coordenadas } from "../tipos";
import { ErrorApi } from "./api";
import { conCache } from "./cache";
import { pedirLista } from "./http";
import { obtenerLinea } from "./lineas";
import { notificarAvisosNuevos } from "./notificaciones";

// La API de la cátedra no trae video ni trazado alternativo en los avisos. Para poder mostrar
// el reproductor y el desvío, si ninguno los trae, el primer aviso usa datos de prueba.
const VIDEO_DE_PRUEBA = "https://www.w3schools.com/html/mov_bbb.mp4";

/** Desvío de prueba: el tramo del medio del recorrido de la línea, corrido unos 170 m. */
async function trazadoDeDesvio(lineaId: string): Promise<Coordenadas[] | null> {
  try {
    const linea = await obtenerLinea(lineaId);
    const puntos = linea.recorridos[0]?.trazado ?? [];
    if (puntos.length < 3) return null;
    const desde = Math.floor(puntos.length / 3);
    const hasta = Math.ceil((puntos.length * 2) / 3);
    return puntos
      .slice(desde, hasta + 1)
      .map((p) => ({ latitud: p.latitud + 0.0015, longitud: p.longitud - 0.0015 }));
  } catch {
    return null;
  }
}

// Los avisos cambian todos los días: se guardan la última vez, y si no hay red
// se muestran con el cartel de "información desactualizada".
export async function obtenerAvisos(): Promise<Aviso[]> {
  const avisos = await conCache("avisos", () => pedirLista<Aviso>("/avisos", { porPagina: 100 }));
  if (avisos.length === 0) return avisos;

  const sinVideo = !avisos.some((a) => a.videoUrl);
  const sinTrazado = !avisos.some((a) => a.trazadoAlternativo);
  if (!sinVideo && !sinTrazado) return avisos;

  const [primero, ...resto] = avisos;
  const desvio = sinTrazado && primero.lineaIds[0] ? await trazadoDeDesvio(primero.lineaIds[0]) : null;
  return [
    {
      ...primero,
      videoUrl: sinVideo ? VIDEO_DE_PRUEBA : primero.videoUrl,
      trazadoAlternativo: desvio ?? primero.trazadoAlternativo,
    },
    ...resto,
  ];
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