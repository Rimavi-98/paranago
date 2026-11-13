import type { Parada } from "../tipos";
import { ErrorApi } from "./api";
import { conCache } from "./cache";
import { pedirLista } from "./http";

export function obtenerParadas(): Promise<Parada[]> {
  return conCache("paradas", () => pedirLista<Parada>("/paradas", { porPagina: 100 }));
}

export async function obtenerParada(id: string): Promise<Parada> {
  const parada = (await obtenerParadas()).find((p) => p.id === id);
  if (!parada) throw new ErrorApi("PARADA_NO_ENCONTRADA", "No existe esa parada.");
  return parada;
}

/** Búsqueda por nombre (sin distinguir mayúsculas ni tildes). Se hace sobre lo guardado: anda sin conexión. */
export async function buscarParadas(texto: string): Promise<Parada[]> {
  const normalizar = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const paradas = await obtenerParadas();
  const q = normalizar(texto.trim());
  if (!q) return paradas;
  return paradas.filter((p) => normalizar(p.nombre).includes(q));
}
