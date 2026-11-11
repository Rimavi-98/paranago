// Cliente HTTP centralizado con Axios para la API real
import { CONFIG } from "@/config";
import axios, { AxiosError } from "axios";
import type { RespuestaOk } from "../tipos";
import { leerToken } from "./sesion";

// Clase personalizada para errores de la API
export class ErrorApi extends Error {
  codigo: string;
  constructor(codigo: string, mensaje: string) {
    super(mensaje);
    this.codigo = codigo;
  }
}

// Se ejecuta cuando el token venció (lo completa el proveedor de sesión)
export const gancho = { alVencerSesion: null as null | (() => void) };

const TIEMPO_MAXIMO_MS = 90000; // 90 segundos para que despierte el backend en Render

// Instancia única de Axios para toda la app
export const apiClient = axios.create({
  baseURL: CONFIG.API_URL,
  timeout: TIEMPO_MAXIMO_MS,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
});

// Interceptor de Peticiones: Agrega el token de autorización automáticamente si existe
apiClient.interceptors.request.use(async (config) => {
  const token = await leerToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de Respuestas: Maneja errores de red y respuestas del servidor unificadamente
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ error?: { codigo?: string; mensaje?: string } }>) => {
    // Si no hay respuesta, es un problema de red (sin internet o servidor caído)
    if (!error.response) {
      throw new ErrorApi("ERROR_DE_RED", "No pudimos conectarnos. Revisá tu conexión.");
    }

    const json = error.response.data;
    const codigo = json?.error?.codigo ?? `ERROR_${error.response.status}`;
    const mensaje = json?.error?.mensaje ?? "Algo salió mal. Probá de nuevo en un rato.";

    // Si la API indica que el token no es válido o venció, disparamos el gancho de sesión
    if (codigo === "NO_AUTENTICADO" && (await leerToken())) {
      gancho.alVencerSesion?.();
    }

    throw new ErrorApi(codigo, mensaje);
  }
);

type Params = Record<string, string | number | undefined>;

/** 
 * Función central para hacer peticiones. 
 * Ya no necesita gestionar manualmente los headers ni el token porque los interceptores lo hacen solos.
 */
export async function pedir<T>(
  ruta: string, 
  opciones?: { metodo?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; params?: Params; cuerpo?: unknown }
): Promise<RespuestaOk<T>> {
  const response = await apiClient.request<RespuestaOk<T>>({
    url: ruta,
    method: opciones?.metodo ?? "GET",
    params: opciones?.params,
    data: opciones?.cuerpo,
  });

  return response.data;
}

/** GET de una lista: devuelve directamente el arreglo `datos`. */
export async function pedirLista<T>(ruta: string, params?: Params): Promise<T[]> {
  const r = await pedir<T[]>(ruta, { params });
  return r.datos;
}