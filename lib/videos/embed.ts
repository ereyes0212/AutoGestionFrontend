import { esIdVideoValido } from "./keys";

// Genera el HTML que el periodista pega en la nota de tiempo.hn.
// Solo entran: un UUID validado, dos enteros y el título escapado.

export const MAX_ANCHO_HORIZONTAL = 720;
export const MAX_ANCHO_VERTICAL = 360;

export function escaparAtributo(texto: string): string {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type DatosEmbed = {
  id: string;
  titulo: string;
  ancho: number;
  alto: number;
  /** URL pública de Autogestión, p. ej. https://autogestion.tiempo.hn */
  baseUrl: string;
};

export function generarCodigoEmbed({ id, titulo, ancho, alto, baseUrl }: DatosEmbed): string {
  if (!esIdVideoValido(id)) throw new Error("Id de video inválido");
  if (!Number.isInteger(ancho) || ancho <= 0 || !Number.isInteger(alto) || alto <= 0) {
    throw new Error("Dimensiones de video inválidas");
  }

  const maxAncho = ancho >= alto ? MAX_ANCHO_HORIZONTAL : MAX_ANCHO_VERTICAL;
  const src = `${baseUrl.replace(/\/+$/, "")}/embed/${id}`;

  return [
    `<div style="position:relative;width:100%;max-width:${maxAncho}px;aspect-ratio:${ancho}/${alto};margin:0 auto">`,
    `  <iframe src="${escaparAtributo(src)}" title="${escaparAtributo(titulo)}"`,
    `    style="position:absolute;inset:0;width:100%;height:100%;border:0"`,
    `    allow="fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe>`,
    `</div>`,
  ].join("\n");
}
