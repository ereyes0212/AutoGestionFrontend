// Reproductor público que se incrusta en las notas de tiempo.hn: <iframe src="…/embed/{id}">.
// No requiere sesión (el middleware no cubre /embed). Solo entrega un HTML chiquito:
// el video lo baja el navegador directo de S3 con una URL firmada y temporal.

import { cacheEmbed } from "@/lib/videos/embed-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // el caché lo maneja cacheEmbed (vencimiento estricto, ver lib/videos/embed-page.ts)

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const forzar = new URL(req.url).searchParams.has("r");
  try {
    const r = await cacheEmbed.obtener(params.id, { forzar });
    return new Response(r.html, { status: r.status, headers: r.headers });
  } catch (e) {
    console.error(`[videos] embed ${params.id}:`, e);
    return new Response("Video no disponible", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
}
