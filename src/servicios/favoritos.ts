// Favoritos guardados en el teléfono con expo-sqlite/kv-store (preferencias, NO el token).
import { useCallback, useEffect, useState } from "react";
import Storage from "../datos/kv";
import type { Usuario } from "../tipos";
import { pedir } from "./apiClient";
import { leerToken } from "./sesion";

export type TipoFavorito = "lineas" | "paradas";

const memoria = new Map<string, string>(); // respaldo si kv-store no está disponible (web)
const clave = (t: TipoFavorito) => `favoritos:${t}`;

export async function obtenerFavoritos(t: TipoFavorito): Promise<string[]> {
  try {
    const raw = await Storage.getItem(clave(t));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    const raw = memoria.get(clave(t));
    return raw ? (JSON.parse(raw) as string[]) : [];
  }
}

async function guardarFavoritos(t: TipoFavorito, ids: string[]) {
  const raw = JSON.stringify(ids);
  memoria.set(clave(t), raw);
  try {
    await Storage.setItem(clave(t), raw);
  } catch {
    // queda en memoria
  }
}

export function useFavoritos(t: TipoFavorito) {
  const [ids, setIds] = useState<string[]>([]);

  const recargar = useCallback(() => obtenerFavoritos(t).then(setIds), [t]);
  useEffect(() => {
    recargar();
  }, [recargar]);

  const alternar = useCallback(
    async (id: string) => {
      const actuales = await obtenerFavoritos(t);
      const nuevos = actuales.includes(id) ? actuales.filter((x) => x !== id) : [...actuales, id];
      await guardarFavoritos(t, nuevos);
      setIds(nuevos);
      sincronizarFavorito(t, id, !actuales.includes(id)).catch(() => {});
    },
    [t]
  );

  return { ids, alternar, recargar, esFavorito: (id: string) => ids.includes(id) };
}

/** Si hay sesión, avisa a la API (PUT/DELETE /yo/lineas-favoritas/:id). Sin sesión o sin red, queda solo en el teléfono. */
async function sincronizarFavorito(t: TipoFavorito, id: string, agregar: boolean): Promise<void> {
  try {
   // Si no hay token, salimos (el interceptor ya maneja el token si existe, pero chequearlo evita llamadas innecesarias)
    if (!(await leerToken())) return;
    await pedir(`/yo/${t === "lineas" ? "lineas" : "paradas"}-favoritas/${encodeURIComponent(id)}`, {
      metodo: agregar ? "PUT" : "DELETE",
      });
  } catch {
    // no es grave: el favorito ya quedó guardado en el teléfono
  }
}

/** Al ingresar: une los favoritos de la cuenta con los del teléfono y sube los que faltaban. */
export async function mezclarFavoritosDelUsuario(usuario: Usuario): Promise<void> {
  for (const t of ["lineas", "paradas"] as TipoFavorito[]) {
    const locales = await obtenerFavoritos(t);
    const remotos = t === "lineas" ? usuario.lineasFavoritas : usuario.paradasFavoritas;
    await guardarFavoritos(t, Array.from(new Set([...remotos, ...locales])));
    for (const id of locales) {
      if (!remotos.includes(id)) await sincronizarFavorito(t, id, true);
    }
  }
}
