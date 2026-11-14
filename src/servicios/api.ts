// Error de la API: lleva el código (ej.: "NO_AUTENTICADO", "ERROR_DE_RED") y el mensaje listo para mostrar.
export class ErrorApi extends Error {
  codigo: string;
  constructor(codigo: string, mensaje: string) {
    super(mensaje);
    this.codigo = codigo;
  }
}
