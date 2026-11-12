import type { Horario, TipoDeDia } from "../tipos";
import { pedirLista } from "./apiClient";
import { conCache } from "./cache";
import { obtenerLineas } from "./lineas";
import { obtenerParada } from "./paradas";

const SIETE_DIAS = 7 * 24 * 60 * 60 * 1000;

/** La tabla de una línea se baja entera UNA vez y queda en el teléfono (sirve sin conexión). */
export function obtenerHorariosDeLinea(lineaId: string): Promise<Horario[]> {
  return conCache(
    `horarios-linea:${lineaId}`,
    () => pedirLista<Horario>("/horarios", { lineaId, porPagina: 5000 }),
    { ttlMs: SIETE_DIAS }
  );
}

/** Horarios de una parada para un tipo de día. Puede ser [] (parada sin servicio). */
export async function obtenerHorariosDeParada(paradaId: string, tipo: TipoDeDia): Promise<Horario[]> {
  const parada = await obtenerParada(paradaId);
  const tablas = await Promise.all(parada.lineaIds.map((id) => obtenerHorariosDeLinea(id)));
  return tablas.flat().filter((h) => h.paradaId === paradaId && h.tipoDeDia === tipo);
}

/** Baja en segundo plano las tablas de todas las líneas, para poder usar la app sin datos. */
export async function descargarTodosLosHorarios(): Promise<void> {
  const lineas = await obtenerLineas();
  for (const l of lineas) {
    try {
      await obtenerHorariosDeLinea(l.id);
    } catch {
      // sin red: se intenta de nuevo la próxima vez
    }
  }
}
