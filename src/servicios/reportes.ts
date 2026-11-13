import * as Network from "expo-network";
import Storage from "../datos/kv";
import { guardarLocal, listarLocales, marcarSincronizado, pendientes } from "../datos/reportesDb";
import type { MotivoDemora, ReporteDeDemora } from "../tipos";
import { fechaConZona } from "../utils/tiempo";
import { ErrorApi } from "./api";
import { subirFoto } from "./archivos";
import { pedir, pedirLista } from "./http";
import { leerToken } from "./sesion";

export const etiquetaMotivo: Record<MotivoDemora, string> = {
  no_paso: "No pasó",
  paso_lleno: "Pasó lleno y no paró",
  demorado: "Viene demorado",
  unidad_rota: "Unidad rota",
  calle_cortada: "Calle cortada",
};

const CLAVE_CONFIRMADOS = "reportes-confirmados";
const NOVENTA_MINUTOS = 90 * 60 * 1000; // la API solo lista reportes de los últimos 90 minutos

// Errores que no se arreglan reintentando: se saca el reporte de la cola para no trabarla
const ERRORES_DEFINITIVOS = [
  "REPORTE_YA_ENVIADO",
  "ID_EN_USO",
  "VALIDACION_FALLIDA",
  "LINEA_NO_ENCONTRADA",
  "PARADA_NO_ENCONTRADA",
  "LINEA_NO_PARA_EN_PARADA",
  "FECHA_EN_EL_FUTURO",
  "ARCHIVO_NO_SUBIDO",
];

export interface NuevoReporte {
  lineaId: string;
  paradaId: string;
  usuarioId: string;
  motivo: MotivoDemora;
  comentario: string | null;
  fotoUri: string | null;
}

/** Guarda SIEMPRE en el teléfono primero (sincronizado = false) y después intenta enviarlo. */
export async function crearReporte(datos: NuevoReporte): Promise<ReporteDeDemora> {
  const reporte: ReporteDeDemora = {
    id: `rep-local-${Date.now()}`, // la API acepta el id del teléfono y reenviarlo no duplica
    ...datos,
    confirmaciones: 0,
    fechaHora: fechaConZona(),
    sincronizado: false,
  };
  await guardarLocal(reporte);
  sincronizarReportes().catch(() => {});
  return reporte;
}

/**
 * Cola offline: sube la foto (si hay) y después envía cada reporte pendiente.
 * Devuelve cuántos se pudieron enviar. Necesita red Y sesión.
 */
export async function sincronizarReportes(): Promise<number> {
  try {
    const red = await Network.getNetworkStateAsync();
    if (red.isConnected === false || red.isInternetReachable === false) return 0;
  } catch {
    // si no podemos saber el estado de la red, intentamos igual
  }
  if (!(await leerToken())) return 0; // sin sesión no se puede enviar: quedan en la cola

  let enviados = 0;
  for (const r of await pendientes()) {
    try {
      let fotoUrl: string | null = null;
      if (r.fotoUri) fotoUrl = r.fotoUri.startsWith("http") ? r.fotoUri : await subirFoto(r.fotoUri);

      await pedir<ReporteDeDemora>("/reportes-demora", {
        metodo: "POST",
        conSesion: true,
        cuerpo: {
          id: r.id,
          lineaId: r.lineaId,
          paradaId: r.paradaId,
          motivo: r.motivo,
          comentario: r.comentario,
          fotoUri: fotoUrl,
          fechaHora: r.fechaHora,
        },
      });
      await marcarSincronizado(r.id);
      enviados++;
    } catch (e) {
      if (e instanceof ErrorApi && ERRORES_DEFINITIVOS.includes(e.codigo)) {
        await marcarSincronizado(r.id);
        continue;
      }
      break; // sin red o error del servidor: se reintenta más tarde
    }
  }
  return enviados;
}

async function leerConfirmados(): Promise<string[]> {
  try {
    const raw = await Storage.getItem(CLAVE_CONFIRMADOS);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export const obtenerConfirmados = leerConfirmados;

/** Confirma un reporte de otro pasajero (necesita sesión). Los errores de la API traen su mensaje. */
export async function confirmarReporte(id: string): Promise<void> {
  await pedir<ReporteDeDemora>(`/reportes-demora/${encodeURIComponent(id)}/confirmaciones`, {
    metodo: "POST",
    conSesion: true,
  });
  const actuales = await leerConfirmados();
  if (!actuales.includes(id)) await Storage.setItem(CLAVE_CONFIRMADOS, JSON.stringify([...actuales, id]));
}

/** Reportes de una parada (últimos 90 minutos): los del servidor + los que todavía esperan en la cola. */
export async function obtenerReportesDeParada(paradaId: string): Promise<ReporteDeDemora[]> {
  let remotos: ReporteDeDemora[] = [];
  try {
    remotos = await pedirLista<ReporteDeDemora>("/reportes-demora", { paradaId, porPagina: 50 });
  } catch {
    remotos = []; // los reportes necesitan red: sin red solo se ven los propios
  }
  const porId = new Map<string, ReporteDeDemora>();
  for (const r of (await listarLocales()).filter((x) => x.paradaId === paradaId)) porId.set(r.id, r);
  for (const r of remotos) porId.set(r.id, r); // si ya llegó al servidor, gana su versión

  const limite = Date.now() - NOVENTA_MINUTOS;
  return [...porId.values()]
    .filter((r) => new Date(r.fechaHora).getTime() >= limite)
    .sort((a, b) => b.fechaHora.localeCompare(a.fechaHora));
}
