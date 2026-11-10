import { createHash } from "node:crypto";
import vm from "node:vm";
import { describe, expect, it, vi } from "vitest";
import { crearCacheEmbed, HASH_CSS, HASH_JS, renderPaginaEmbed, type DatosReproductor } from "../embed-page";

const ID = "84ae641e-7298-42f5-9f5a-93e2e41e6dfd";
const DATOS: DatosReproductor = {
  titulo: `Nota "con" <comillas> & más`,
  urlVideo: `https://s3.us-east-2.amazonaws.com/autogestion.tiempo.hn/videos/convertidos/${ID}/video.mp4?X-Amz-Signature=abc&X-Amz-Expires=21600`,
  urlPoster: `https://s3.us-east-2.amazonaws.com/autogestion.tiempo.hn/videos/convertidos/${ID}/poster.jpg?X-Amz-Signature=def`,
};

const sha = (s: string) => `'sha256-${createHash("sha256").update(s, "utf8").digest("base64")}'`;
const entre = (html: string, tag: string) => html.split(`<${tag}>`)[1].split(`</${tag}>`)[0];

describe("renderPaginaEmbed", () => {
  const { html, csp } = renderPaginaEmbed(DATOS);

  it("la CSP autoriza exactamente el script y el estilo que van en la página (por hash)", () => {
    expect(HASH_JS).toBe(sha(entre(html, "script")));
    expect(HASH_CSS).toBe(sha(entre(html, "style")));
    expect(csp).toContain(`script-src ${HASH_JS}`);
    expect(csp).toContain(`style-src ${HASH_CSS}`);
    expect(csp).not.toContain("unsafe-inline");
  });

  it("solo deja cargar video e imagen desde S3", () => {
    expect(csp).toContain("media-src https://s3.us-east-2.amazonaws.com");
    expect(csp).toContain("img-src https://s3.us-east-2.amazonaws.com");
    expect(csp).toContain("default-src 'none'");
  });

  it("solo se puede incrustar en tiempo.hn y en la propia app", () => {
    expect(csp).toMatch(/frame-ancestors https:\/\/tiempo\.hn https:\/\/\*\.tiempo\.hn .*'self'/);
  });

  it("escapa las URLs firmadas y el título", () => {
    expect(html).toContain("&amp;X-Amz-Expires=21600");
    expect(html).toContain("<title>Nota &quot;con&quot; &lt;comillas&gt; &amp; más</title>");
  });

  it("sin datos: página 'no disponible' sin video y sin permitir medios", () => {
    const vacio = renderPaginaEmbed(null);
    expect(vacio.html).not.toMatch(/<video[^>]*data-src/);
    expect(vacio.csp).toContain("media-src 'none'");
  });
});

/** Ejecuta el script del reproductor en un "navegador" mínimo. */
function ejecutarScript(html: string, search = "") {
  const atributos: Record<string, string> = {};
  const etiquetaVideo = /<video[^>]*>/.exec(html)?.[0] ?? "";
  const patron = /data-(src|poster)="([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = patron.exec(etiquetaVideo))) atributos[`data-${m[1]}`] = m[2].replace(/&amp;/g, "&");
  let alError: (() => void) | null = null;
  const video = {
    hidden: false,
    poster: "",
    src: "",
    getAttribute: (n: string) => atributos[n] ?? null,
    removeAttribute(n: string) {
      if (n === "src") this.src = "";
    },
    addEventListener: (_e: string, fn: () => void) => (alError = fn),
  };
  const aviso = { hidden: true };
  const location = { search, pathname: `/embed/${ID}`, replace: vi.fn() };
  vm.runInNewContext(entre(html, "script"), {
    document: { getElementById: (id: string) => (id === "video" ? video : aviso) },
    location,
  });
  return { video, aviso, location, dispararError: () => alError?.() };
}

describe("script del reproductor", () => {
  it("carga el video firmado", () => {
    const { video, aviso } = ejecutarScript(renderPaginaEmbed(DATOS).html);
    expect(video.src).toBe(DATOS!.urlVideo);
    expect(video.poster).toBe(DATOS!.urlPoster);
    expect(aviso.hidden).toBe(true);
  });

  it("si la firma venció, recarga una sola vez con ?r=", () => {
    const primera = ejecutarScript(renderPaginaEmbed(DATOS).html);
    primera.dispararError();
    expect(primera.location.replace).toHaveBeenCalledWith(expect.stringMatching(new RegExp(`^/embed/${ID}\\?r=\\d+$`)));

    const segunda = ejecutarScript(renderPaginaEmbed(DATOS).html, "?r=123");
    segunda.dispararError();
    expect(segunda.location.replace).not.toHaveBeenCalled();
    expect(segunda.aviso.hidden).toBe(false);
  });

  it("sin video: muestra 'Video no disponible'", () => {
    const { video, aviso } = ejecutarScript(renderPaginaEmbed(null).html);
    expect(video.src).toBe("");
    expect(aviso.hidden).toBe(false);
  });
});

describe("crearCacheEmbed", () => {
  function preparar(ttlSeg = 600) {
    let t = 1_000_000;
    const cargar = vi.fn(async () => ({ datos: DATOS, ttlSeg }));
    const cache = crearCacheEmbed({ cargar, ahora: () => t, max: 3 });
    return { cache, cargar, avanzar: (ms: number) => (t += ms) };
  }

  it("reutiliza la página mientras está vigente y la regenera al vencer", async () => {
    const { cache, cargar, avanzar } = preparar(600);
    await cache.obtener(ID);
    avanzar(599_000);
    await cache.obtener(ID);
    expect(cargar).toHaveBeenCalledTimes(1);
    avanzar(1_000);
    await cache.obtener(ID);
    expect(cargar).toHaveBeenCalledTimes(2);
  });

  it("Cloudflare nunca guarda más de lo que le queda a la entrada", async () => {
    const { cache, avanzar } = preparar(600);
    expect((await cache.obtener(ID)).headers["Cache-Control"]).toBe("public, max-age=60, s-maxage=600");
    avanzar(570_000);
    expect((await cache.obtener(ID)).headers["Cache-Control"]).toBe("public, max-age=30, s-maxage=30");
  });

  it("?r= solo regenera si la entrada tiene más de 1 minuto (evita abuso)", async () => {
    const { cache, cargar, avanzar } = preparar();
    await cache.obtener(ID);
    await cache.obtener(ID, { forzar: true });
    expect(cargar).toHaveBeenCalledTimes(1);
    avanzar(60_000);
    await cache.obtener(ID, { forzar: true });
    expect(cargar).toHaveBeenCalledTimes(2);
  });

  it("id inválido: 404 sin consultar la base", async () => {
    const { cache, cargar } = preparar();
    const r = await cache.obtener("../../vouchers");
    expect(r.status).toBe(404);
    expect(cargar).not.toHaveBeenCalled();
  });

  it("video inexistente: 404 y también se guarda un rato", async () => {
    const cargar = vi.fn(async () => ({ datos: null, ttlSeg: 60 }));
    const cache = crearCacheEmbed({ cargar });
    expect((await cache.obtener(ID)).status).toBe(404);
    await cache.obtener(ID);
    expect(cargar).toHaveBeenCalledTimes(1);
  });

  it("limita cuántos videos guarda en memoria e invalidar los saca", async () => {
    const { cache } = preparar();
    for (const n of [1, 2, 3, 4]) await cache.obtener(ID.replace(/.$/, String(n)));
    expect(cache.tamano()).toBe(3);
    cache.invalidar(ID.replace(/.$/, "4"));
    expect(cache.tamano()).toBe(2);
  });

  it("entrega los encabezados de seguridad", async () => {
    const { cache } = preparar();
    const { headers } = await cache.obtener(ID);
    expect(headers["Content-Security-Policy"]).toContain("frame-ancestors");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Content-Type"]).toBe("text/html; charset=utf-8");
  });
});
