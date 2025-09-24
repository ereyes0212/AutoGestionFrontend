import { getSessionPermisos } from "@/auth";
import broadcaster from "../broadcaster";

export const runtime = "edge";            // ✅ Edge Runtime
export const dynamic = "force-dynamic";   // ✅ Evita cacheo de respuesta

export async function GET(req: Request) {
    const permisos = await getSessionPermisos();
    if (!permisos?.includes?.("ver_notas")) {
        return new Response("Forbidden", { status: 403 });
    }

    let clientId: number | undefined;

    const stream = new ReadableStream({
        start(controller) {
            clientId = broadcaster.register(controller);

            // Enviar comentario inicial para mantener conexión viva
            controller.enqueue(new TextEncoder().encode(":ok\n\n"));

            // Opcional: enviar heartbeat cada 15s para evitar timeout del CDN
            const interval = setInterval(() => {
                try {
                    controller.enqueue(new TextEncoder().encode(":heartbeat\n\n"));
                } catch (e) {
                    clearInterval(interval);
                }
            }, 15000);
        },
        cancel() {
            if (clientId !== undefined) {
                try {
                    broadcaster.unregister(clientId);
                } catch (e) { /* noop */ }
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
        },
    });
}
