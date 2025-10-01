// app/api/notes/stream/route.ts
import { getSessionPermisos } from "@/auth"; // ajusta si hace falta
import broadcaster from "../broadcaster";

export async function GET(req: Request) {
    const permisos = await getSessionPermisos();
    if (!permisos?.includes?.("ver_notas")) {
        return new Response("Forbidden", { status: 403 });
    }

    let clientId: number | undefined;

    const stream = new ReadableStream({
        start(controller) {
            clientId = broadcaster.register(controller);

            // Send an initial comment/heartbeat
            controller.enqueue(new TextEncoder().encode(":ok\n\n"));
        },
        cancel() {
            // Se ejecuta cuando el cliente cierra la conexión -> desregistrar
            if (clientId !== undefined) {
                try { broadcaster.unregister(clientId); } catch (e) { /* noop */ }
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