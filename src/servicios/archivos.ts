// POST /archivos (multipart, campo "archivo"): devuelve la URL que después va en `fotoUri` del reporte.
import { apiClient, ErrorApi } from "./apiClient";

export async function subirFoto(uri: string): Promise<string> {
  const extension = (uri.split(".").pop() ?? "jpg").toLowerCase();
  const tipo = extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : "image/jpeg";

  // preparamos el formulario multipart
  const formulario = new FormData();
  formulario.append("archivo", { uri, name: `foto.${extension}`, type: tipo } as any);

  let respuesta: {data: any};
  try {
    // Usamos apiClient.post. El interceptor ya le inyecta el token de sesión y Axios detecta el FormData y configura automáticamente el "Content-Type: multipart/form-data" con su boundary.
      respuesta = await apiClient.post("/archivos", formulario);
    } catch (error:any) {
    // como usamos el interceptor que hicimos antes, los errores de red ya vienen manejados, pero por seguridad mantenemos el try/catch por si el backend devuelve un error estructurado.
    if (error instanceof ErrorApi) {
      throw error;
    }
    throw new ErrorApi("ERROR_INTERNO", "No pudimos subir la foto. Probá de nuevo en un rato.");
  }

  // Axios ya parsea la respuesta automáticamente y te la entrega limpia en respuesta.data

  const json = respuesta.data;
    if (!json?.datos?.url) {
    throw new ErrorApi(
      json?.error?.codigo ?? "ERROR_INTERNO",
      json?.error?.mensaje ?? "No pudimos subir la foto. Probá de nuevo en un rato."
    );
  }
  return json.datos.url as string;
}
