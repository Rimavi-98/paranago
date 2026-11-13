// Cliente HTTP de la API real. Entiende el sobre { datos, meta } / { error: { codigo, mensaje } }.
import { API_URL } from "../config";
import type { RespuestaOk } from "../tipos";
import { ErrorApi } from "./api";
import { leerToken } from "./sesion";

// Para probar errores y demoras sin apagar la wifi (la API lo permite en desarrollo):
//   simulacion.cabecera = "error-500"   o   "demora-3000"
export const simulacion = { cabecera: null as string | null };

// Lo completa el proveedor de sesión: se llama cuando el token venció (dura 30 días)
export const gancho = { alVencerSesion: null as null | (() => void) };

const TIEMPO_MAXIMO_MS = 90000; // el plan gratis de Render tarda ~1 min en despertar

type Params = Record<string, string | number | undefined>;

interface Opciones {
  metodo?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  params?: Params;
  cuerpo?: unknown;
  conSesion?: boolean; // manda Authorization: Bearer <token>
}

function armarUrl(ruta: string, params?: Params): string {
  const consulta = Object.entries(params ?? {})
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return `${API_URL}${ruta}${consulta ? `?${consulta}` : ""}`;
}

export async function pedir<T>(ruta: string, op: Opciones = {}): Promise<RespuestaOk<T>> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (op.cuerpo !== undefined) headers["Content-Type"] = "application/json";
  if (simulacion.cabecera) headers["X-Simular"] = simulacion.cabecera;
  if (op.conSesion) {
    const token = await leerToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), TIEMPO_MAXIMO_MS);

  let respuesta: Response;
  try {
    respuesta = await fetch(armarUrl(ruta, op.params), {
      method: op.metodo ?? "GET",
      headers,
      body: op.cuerpo !== undefined ? JSON.stringify(op.cuerpo) : undefined,
      signal: control.signal,
    });
  } catch {
    throw new ErrorApi("ERROR_DE_RED", "No pudimos conectarnos. Revisá tu conexión.");
  } finally {
    clearTimeout(reloj);
  }

  let json: any = null;
  try {
    json = await respuesta.json();
  } catch {
    // respuesta sin cuerpo JSON
  }

  if (!respuesta.ok || json?.error) {
    const codigo = json?.error?.codigo ?? "ERROR_INTERNO";
    if (codigo === "NO_AUTENTICADO" && op.conSesion && (await leerToken())) gancho.alVencerSesion?.();
    throw new ErrorApi(
      codigo,
      json?.error?.mensaje ?? "Algo salió mal. Probá de nuevo en un rato."
    );
  }
  return json as RespuestaOk<T>;
}

/** GET de una lista: devuelve directamente el arreglo `datos`. */
export async function pedirLista<T>(ruta: string, params?: Params): Promise<T[]> {
  const r = await pedir<T[]>(ruta, { params });
  return r.datos;
}
