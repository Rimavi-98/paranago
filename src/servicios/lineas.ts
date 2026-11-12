import type { Linea } from "../tipos";
import { ErrorApi, pedirLista } from "./apiClient";
import { conCache } from "./cache";

export function obtenerLineas(): Promise<Linea[]> {
  return conCache("lineas", () => pedirLista<Linea>("/lineas", { porPagina: 100 }));
}

export async function obtenerLinea(id: string): Promise<Linea> {
  const linea = (await obtenerLineas()).find((l) => l.id === id);
  if (!linea) throw new ErrorApi("LINEA_NO_ENCONTRADA", "No existe esa línea.");
  return linea;
}
