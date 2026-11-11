import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Platform } from "react-native";
import { gancho } from "../servicios/apiClient";
import * as auth from "../servicios/auth";
import { mezclarFavoritosDelUsuario } from "../servicios/favoritos";
import { sincronizarReportes } from "../servicios/reportes";
import { borrarSesion, guardarSesion, leerToken, leerUsuario } from "../servicios/sesion";
import type { Usuario } from "../tipos";

// cargando: leyendo el token | sin_sesion: anónimo | bloqueada: hay sesión pero falta huella/rostro | activa
export type EstadoSesion = "cargando" | "sin_sesion" | "bloqueada" | "activa";

interface ContextoSesion {
  estado: EstadoSesion;
  usuario: Usuario | null;
  ingresar: (email: string, password: string) => Promise<void>;
  registrar: (nombre: string, email: string, password: string) => Promise<void>;
  salir: () => Promise<void>;
  desbloquear: () => void;
  desbloquearConPassword: (password: string) => Promise<void>;
}

const Ctx = createContext<ContextoSesion | null>(null);

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoSesion>("cargando");
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  // Al abrir la app: si hay sesión guardada, queda bloqueada hasta el reingreso (huella/rostro)
  useEffect(() => {
    (async () => {
      const token = await leerToken();
      const u = await leerUsuario();
      if (token && u) {
        setUsuario(u);
        setEstado(Platform.OS === "web" ? "activa" : "bloqueada");
      } else {
        setEstado("sin_sesion");
      }
    })();
  }, []);

  // Si la API dice que el token venció (30 días), se cierra la sesión y hay que volver a ingresar
  useEffect(() => {
    gancho.alVencerSesion = () => {
      borrarSesion().finally(() => {
        setUsuario(null);
        setEstado("sin_sesion");
      });
    };
    return () => {
      gancho.alVencerSesion = null;
    };
  }, []);

  const abrirSesion = useCallback(async (r: auth.RespuestaAuth) => {
    await guardarSesion(r.token, r.usuario);
    setUsuario(r.usuario);
    setEstado("activa");
    mezclarFavoritosDelUsuario(r.usuario).catch(() => {});
    sincronizarReportes().catch(() => {}); // envía lo que haya quedado en la cola
  }, []);

  const valor = useMemo<ContextoSesion>(
    () => ({
      estado,
      usuario,
      ingresar: async (email, password) => abrirSesion(await auth.ingresar(email, password)),
      registrar: async (nombre, email, password) => abrirSesion(await auth.registrar(nombre, email, password)),
      salir: async () => {
        await borrarSesion();
        setUsuario(null);
        setEstado("sin_sesion");
      },
      desbloquear: () => setEstado("activa"),
      desbloquearConPassword: async (password) => {
        if (!usuario) throw new Error("No hay sesión.");
        await auth.ingresar(usuario.email, password); // lanza error si es incorrecta
        setEstado("activa");
      },
    }),
    [estado, usuario, abrirSesion]
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useSesion(): ContextoSesion {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSesion se usa dentro de ProveedorSesion");
  return v;
}
