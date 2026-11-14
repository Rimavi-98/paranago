// POST /archivos (multipart, campo "archivo"): devuelve la URL que después va en `fotoUri` del reporte.
import { API_URL } from "../config";
import { ErrorApi } from "./api";
import { leerToken } from "./sesion";

const TIEMPO_MAXIMO_MS = 45_000; // una subida colgada no puede trabar la cola: pasado este tiempo el reporte sale sin foto

export async function subirFoto(uri: string): Promise<string> {
  const token = await leerToken();
  const extension = (uri.split(".").pop() ?? "jpg").toLowerCase();
  const tipo = extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : "image/jpeg";

  const formulario = new FormData();
  formulario.append("archivo", { uri, name: `foto.${extension}`, type: tipo } as any);

  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), TIEMPO_MAXIMO_MS);

  let respuesta: Response;
  let json: any = null;
  try {
    // OJO: no se pone Content-Type a mano, fetch arma el multipart solo
    respuesta = await fetch(`${API_URL}/archivos`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formulario,
      signal: control.signal,
    });
    json = await respuesta.json().catch(() => null);
  } catch {
    throw new ErrorApi("ERROR_DE_RED", "No pudimos conectarnos. Revisá tu conexión.");
  } finally {
    clearTimeout(temporizador);
  }

  if (!respuesta.ok || json?.error || !json?.datos?.url) {
    throw new ErrorApi(
      json?.error?.codigo ?? "ERROR_INTERNO",
      json?.error?.mensaje ?? "No pudimos subir la foto. Probá de nuevo en un rato."
    );
  }
  return json.datos.url as string;
}
