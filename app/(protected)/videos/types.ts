export type VideoEstado = "SUBIENDO" | "EN_COLA" | "PROCESANDO" | "LISTO" | "ERROR";

export type VideoFila = {
  id: string;
  titulo: string;
  estado: VideoEstado;
  nombreOriginal: string;
  tamanoBytes: number;
  duracionSeg: number | null;
  ancho: number | null;
  alto: number | null;
  errorMensaje: string | null;
  creadorEmpleadoId: string;
  creador: string;
  creadoAt: string;
  /** HTML para pegar en la nota (solo cuando el video está LISTO). */
  codigo: string | null;
};

export type Resultado<T = undefined> = { ok: true; data: T } | { ok: false; error: string };
