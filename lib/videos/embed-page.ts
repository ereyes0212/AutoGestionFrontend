// Página del reproductor que se incrusta en tiempo.hn (GET /embed/{id}).
//
// - Una sola respuesta HTML de pocos KB: el CSS y el JS van adentro y la CSP los autoriza por hash.
// - El video NO pasa por Autogestión: la página trae URLs firmadas y temporales de S3 (bucket privado)
//   y el navegador del lector baja el video directo de S3.
// - Caché con vencimiento estricto (memoria + encabezados para Cloudflare) que siempre dura mucho
//   menos que la firma, así nunca se entrega una URL vencida desde el caché.
// - Si aun así la firma vence (página abierta muchas horas), el reproductor recarga una sola vez con ?r=.

import { createHash } from "node:crypto";
import { getFrameAncestors } from "./config";
import { escaparAtributo } from "./embed";
import { esIdVideoValido } from "./keys";

const CSS = `html,body{margin:0;height:100%;background:#000;overflow:hidden}
video{display:block;width:100%;height:100%;object-fit:contain;background:#000}
#aviso{display:flex;align-items:center;justify-content:center;height:100%;margin:0;color:#d4d4d4;font:15px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif}
[hidden]{display:none!important}`;

const JS = `(function () {
  var video = document.getElementById("video");
  var aviso = document.getElementById("aviso");
  function noDisponible() {
    video.removeAttribute("src");
    video.hidden = true;
    aviso.hidden = false;
  }
  var src = video.getAttribute("data-src");
  if (!src) return noDisponible();
  video.addEventListener("error", function () {
    // La firma de S3 pudo vencer: se pide la página de nuevo (sin caché) una sola vez.
    if (!/[?&]r=/.test(location.search)) return location.replace(location.pathname + "?r=" + Date.now());
    noDisponible();
  });
  video.poster = video.getAttribute("data-poster") || "";
  video.src = src;
})();`;

const hash = (contenido: string) => `'sha256-${createHash("sha256").update(contenido, "utf8").digest("base64")}'`;
export const HASH_JS = hash(JS);
export const HASH_CSS = hash(CSS);

export type DatosReproductor = { titulo: string; urlVideo: string; urlPoster: string } | null;

function origenDe(url: string): string {
  const { origin, protocol } = new URL(url);
  if (protocol !== "https:" && protocol !== "http:") throw new Error("URL de video inválida");
  return origin;
}

/** HTML + CSP del reproductor. `datos = null` → página "Video no disponible". */
export function renderPaginaEmbed(datos: DatosReproductor): { html: string; csp: string } {
  const origenMedia = datos ? origenDe(datos.urlVideo) : "'none'";
  const csp = [
    "default-src 'none'",
    `script-src ${HASH_JS}`,
    `style-src ${HASH_CSS}`,
    `media-src ${origenMedia}`,
    `img-src ${origenMedia}`,
    `frame-ancestors ${getFrameAncestors()}`,
    "base-uri 'none'",
    "form-action 'none'",
  ].join("; ");

  const atributosVideo = datos
    ? ` data-src="${escaparAtributo(datos.urlVideo)}" data-poster="${escaparAtributo(datos.urlPoster)}"`
    : "";

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escaparAtributo(datos?.titulo ?? "Video no disponible")}</title>
<style>${CSS}</style>
</head>
<body>
<video id="video" controls playsinline preload="metadata"${atributosVideo}></video>
<p id="aviso" hidden>Video no disponible</p>
<script>${JS}</script>
</body>
</html>
`;
  return { html, csp };
}

// ─── Caché ───────────────────────────────────────────────────────────────────

export type RespuestaEmbed = { status: number; html: string; headers: Record<string, string> };

type Entrada = { status: number; html: string; csp: string; creada: number; expira: number };

type OpcionesCache = {
  /** Carga los datos del video y cuántos segundos se puede reutilizar la página (siempre < firma). */
  cargar: (id: string) => Promise<{ datos: DatosReproductor; ttlSeg: number }>;
  ahora?: () => number;
  /** Máximo de videos en memoria (se descartan los más viejos). */
  max?: number;
  /** Con ?r= solo se regenera si la entrada tiene más de esto (evita abuso). */
  minEdadForzarMs?: number;
};

export function crearCacheEmbed({ cargar, ahora = Date.now, max = 2000, minEdadForzarMs = 60_000 }: OpcionesCache) {
  const mapa = new Map<string, Entrada>();

  function responder(e: Pick<Entrada, "status" | "html" | "csp">, segundosRestantes: number): RespuestaEmbed {
    const s = Math.max(0, Math.floor(segundosRestantes));
    return {
      status: e.status,
      html: e.html,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Security-Policy": e.csp,
        // El navegador lo guarda 1 min; Cloudflare, lo que le queda a la entrada (nunca más que la firma).
        "Cache-Control": `public, max-age=${Math.min(60, s)}, s-maxage=${s}`,
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
      },
    };
  }

  async function obtener(id: string, { forzar = false }: { forzar?: boolean } = {}): Promise<RespuestaEmbed> {
    if (!esIdVideoValido(id)) {
      return responder({ status: 404, ...renderPaginaEmbed(null) }, 300);
    }

    const t = ahora();
    const actual = mapa.get(id);
    const vigente = actual && actual.expira > t;
    const puedeReusar = vigente && !(forzar && t - actual.creada >= minEdadForzarMs);
    if (actual && puedeReusar) return responder(actual, (actual.expira - t) / 1000);

    const { datos, ttlSeg } = await cargar(id);
    const { html, csp } = renderPaginaEmbed(datos);
    const entrada: Entrada = { status: datos ? 200 : 404, html, csp, creada: t, expira: t + ttlSeg * 1000 };

    mapa.delete(id);
    mapa.set(id, entrada);
    while (mapa.size > max) {
      const masViejo = mapa.keys().next().value;
      if (masViejo === undefined) break;
      mapa.delete(masViejo);
    }
    return responder(entrada, ttlSeg);
  }

  return {
    obtener,
    /** Al eliminar un video: deja de servirse desde la memoria de este servidor al instante. */
    invalidar: (id: string) => mapa.delete(id),
    tamano: () => mapa.size,
  };
}
