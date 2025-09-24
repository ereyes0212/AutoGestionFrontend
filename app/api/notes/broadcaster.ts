// app/api/notes/broadcaster.ts
type Client = { id: number; controller: ReadableStreamDefaultController<Uint8Array> };
const encoder = new TextEncoder();

if (!(globalThis as any).__NOTES_BROADCASTER) {
    (globalThis as any).__NOTES_BROADCASTER = {
        clients: [] as Client[],
        nextId: 1,
        register(controller: ReadableStreamDefaultController<Uint8Array>) {
            const id = (globalThis as any).__NOTES_BROADCASTER.nextId++;
            (globalThis as any).__NOTES_BROADCASTER.clients.push({ id, controller });
            return id;
        },
        unregister(id: number) {
            (globalThis as any).__NOTES_BROADCASTER.clients =
                (globalThis as any).__NOTES_BROADCASTER.clients.filter((c: Client) => c.id !== id);
        },
        broadcast(payload: any) {
            const text = `data: ${JSON.stringify(payload)}\n\n`;
            const chunk = encoder.encode(text);

            // Copiamos la lista porque la iteración puede mutar el array
            const clients = [...(globalThis as any).__NOTES_BROADCASTER.clients];
            for (const c of clients) {
                try {
                    c.controller.enqueue(chunk);
                } catch (err) {
                    // Si falla el enqueue, quitamos al cliente (probablemente desconectado)
                    try {
                        (globalThis as any).__NOTES_BROADCASTER.clients =
                            (globalThis as any).__NOTES_BROADCASTER.clients.filter((x: Client) => x.id !== c.id);
                    } catch (e) {
                        // noop
                    }
                }
            }
        },
    };
}

export default (globalThis as any).__NOTES_BROADCASTER as {
    clients: Client[];
    nextId: number;
    register(controller: ReadableStreamDefaultController<Uint8Array>): number;
    unregister(id: number): void;
    broadcast(payload: any): void;
};
