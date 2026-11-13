import { conCache } from "./cache";
import { pedirLista } from "./http";

const SIETE_DIAS = 7 * 24 * 60 * 60 * 1000;

// ATENCIÓN: se asume que cada feriado trae su fecha como "AAAA-MM-DD" (en `fecha`).
// Si la API los devuelve distinto, se ajusta SOLO esta función.
function extraerFecha(x: unknown): string | null {
  const v = typeof x === "string" ? x : (x as any)?.fecha ?? (x as any)?.dia;
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null;
}

/** Fechas de feriados ("AAAA-MM-DD") de este año y el próximo, guardadas para usar sin conexión. */
export async function obtenerFeriados(): Promise<string[]> {
  const anio = new Date().getFullYear();
  try {
    return await conCache(
      "feriados",
      async () => {
        const listas = await Promise.all([anio, anio + 1].map((a) => pedirLista<unknown>("/feriados", { anio: a })));
        return listas.flat().map(extraerFecha).filter((f): f is string => f !== null);
      },
      { ttlMs: SIETE_DIAS }
    );
  } catch {
    return []; // sin feriados la app sigue andando (usa hábil, sábado o domingo)
  }
}
