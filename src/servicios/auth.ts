// Cuenta contra la API real: POST /auth/registro y POST /auth/ingreso devuelven { token, usuario }.
import type { Usuario } from "../tipos";
import { pedir } from "./apiClient";

export interface RespuestaAuth {
  token: string;
  usuario: Usuario;
}

export async function registrar(nombre: string, email: string, password: string): Promise<RespuestaAuth> {
  const r = await pedir<RespuestaAuth>("/auth/registro", {
    metodo: "POST",
    cuerpo: { nombre: nombre.trim(), email: email.trim(), contrasena: password },
  });
  return r.datos;
}

export async function ingresar(email: string, password: string): Promise<RespuestaAuth> {
  const r = await pedir<RespuestaAuth>("/auth/ingreso", {
    metodo: "POST",
    cuerpo: { email: email.trim(), contrasena: password },
  });
  return r.datos;
}
