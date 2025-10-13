"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, CheckCheck, Paperclip, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import useSocket from "@/hooks/useSocket"; // ajustá la ruta si tu hook está en otro lado
import { Usuario } from "../../usuarios/type";
import { sendMessage as sendMessageAction } from "../actions"; // tu server action (fallback)
import EditGroupDialog from "./EditGroupDialog";

// --- tipos (copiados/adaptados de tu versión)
export type Mensaje = {
    id: string;
    contenido: string;
    createdAt: string;
    autor: {
        id: string;
        usuario: string;
    };
    attachments?: {
        id: string;
        nombre: string | null;
        url: string;
        tipo?: string | null;
        tamaño?: number | null;
        createdAt: string;
    }[];
    estados?: {
        id: string;
        usuarioId: string;
        entregado: boolean;
        leido: boolean;
        entregadoAt?: string | null;
        leidoAt?: string | null;
    }[];
};

const schema = z.object({
    contenido: z.string().min(1, "No puede estar vacío"),
});
type FormValues = z.infer<typeof schema>;

export function ChatConversation({
    conversacionId,
    currentUserId,
    initialMessages,
    participantes,
    usuarios,
    creadorId,
    nombreActual,
    tipo
}: {
    conversacionId: string;
    currentUserId: string;
    initialMessages: any[];
    participantes: Usuario[];
    usuarios: Usuario[];
    creadorId: string;
    nombreActual: string;
    tipo: string;
}) {
    // mapear mensajes iniciales (igual que tenías)
    const mappedMensajes: Mensaje[] = initialMessages.map((m) => ({
        id: m.id,
        contenido: m.contenido,
        createdAt:
            m.createdAt instanceof Date ? m.createdAt.toISOString() : new Date(m.createdAt).toISOString(),
        autor: {
            id: m.autor.id,
            usuario: m.autor.usuario,
        },
        attachments: m.attachments?.map((a: any) => ({
            id: a.id,
            nombre: a.nombre,
            url: a.url,
            tipo: a.tipo,
            tamaño: a.tamaño ?? undefined,
            createdAt:
                a.createdAt instanceof Date ? a.createdAt.toISOString() : new Date(a.createdAt).toISOString(),
        })),
        estados: m.estados?.map((e: any) => ({
            id: e.id,
            usuarioId: e.usuarioId,
            entregado: e.entregado,
            leido: e.leido,
            entregadoAt: e.entregadoAt
                ? e.entregadoAt instanceof Date
                    ? e.entregadoAt.toISOString()
                    : new Date(e.entregadoAt).toISOString()
                : null,
            leidoAt: e.leidoAt
                ? e.leidoAt instanceof Date
                    ? e.leidoAt.toISOString()
                    : new Date(e.leidoAt).toISOString()
                : null,
        })),
    }));

    const [mensajes, setMensajes] = useState<Mensaje[]>(mappedMensajes);
    const [loading, setLoading] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { contenido: "" },
    });

    const scrollRef = useRef<HTMLDivElement | null>(null);

    // audio context ref para notificaciones
    const audioCtxRef = useRef<AudioContext | null>(null);

    // socket hook (tu hook devuelve socketRef y connected)
    const { socketRef, connected } = useSocket();
    const socket = socketRef?.current ?? null;

    // helper: play short notification beep using WebAudio API
    const playNotificationSound = () => {
        try {
            const AudioCtor = (window as any).AudioContext || (window as any).webkitAudioContext;
            if (!AudioCtor) return; // no disponible
            const ctx = audioCtxRef.current ?? new AudioCtor();
            audioCtxRef.current = ctx;

            // if suspended (autoplay policy), attempt to resume (may require user gesture)
            if (ctx.state === "suspended") {
                ctx.resume().catch(() => {
                    /* ignore */
                });
            }

            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "sine";
            osc.frequency.setValueAtTime(1000, now); // tono
            gain.gain.setValueAtTime(0.0001, now);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            gain.gain.exponentialRampToValueAtTime(0.3, now + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
            osc.stop(now + 0.2);

            // cleanup automatic (browser handles it after stop)
        } catch (e) {
            // fallback silencioso si algo falla
            try {
                // pequeño fallback: usar Audio con data URI beep (muy básico)
                const beep = new Audio(
                    "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA="
                );
                beep.play().catch(() => { });
            } catch { }
        }
    };

    // Intentar reanudar AudioContext en la primera interacción del usuario (para evitar bloqueo por autoplay)
    useEffect(() => {
        const resume = () => {
            try {
                if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
                    audioCtxRef.current.resume().catch(() => { });
                }
            } catch { }
            window.removeEventListener("click", resume);
            window.removeEventListener("touchstart", resume);
        };
        window.addEventListener("click", resume);
        window.addEventListener("touchstart", resume);
        return () => {
            window.removeEventListener("click", resume);
            window.removeEventListener("touchstart", resume);
        };
    }, []);

    // scroll to bottom when mensajes change
    useEffect(() => {
        if (scrollRef.current) {
            setTimeout(() => {
                if (!scrollRef.current) return;
                try {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                } catch { }
            }, 50);
        }
    }, [mensajes]);

    // scroll to bottom on mount (entering the screen)
    useEffect(() => {
        if (scrollRef.current) {
            setTimeout(() => {
                if (!scrollRef.current) return;
                try {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                } catch { }
            }, 80);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // run once on mount

    // join room y listeners
    useEffect(() => {
        if (!connected || !socket) return;

        // Unirse a la conversación
        socket.emit("join_conversation", conversacionId, (resp: any) => {
            if (!resp || resp.status !== "OK") {
                console.warn("No pudo unirse a la conversación:", resp);
            }
        });

        // Manejar mensajes entrantes
        const onMessage = (m: any) => {
            try {
                // Normalizar el formato que viene del servidor
                const nuevo: Mensaje = {
                    id: m.id,
                    contenido: m.contenido,
                    createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : new Date().toISOString(),
                    autor: { id: m.autor?.id ?? m.autorId, usuario: m.autor?.usuario ?? m.autorUsuario ?? "Desconocido" },
                    attachments:
                        m.attachments?.map((a: any) => ({
                            id: a.id,
                            nombre: a.nombre ?? null,
                            url: a.url,
                            tipo: a.tipo ?? null,
                            tamaño: a.tamaño ?? undefined,
                            createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : new Date().toISOString(),
                        })) ?? [],
                    estados: m.estados ?? [],
                };

                // Evitar duplicados: si ya existe mensaje con mismo id no lo insertamos
                setMensajes((prev) => {
                    if (prev.some((x) => x.id === nuevo.id)) return prev;
                    // play sound only if mensaje de otro usuario
                    if (nuevo.autor.id !== currentUserId) {
                        playNotificationSound();
                    }
                    return [...prev, nuevo];
                });

                // Opcional: podrías emitir 'mark_read' aquí si querés marcar como leido al recibir (no lo hago por defecto)
            } catch (err) {
                console.error("onMessage parse error:", err);
            }
        };

        socket.on("message", onMessage);

        // Escuchar actualizaciones de estado (opcional)
        const onMessageRead = (payload: any) => {
            const { mensajeId, usuarioId } = payload ?? {};
            if (!mensajeId) return;
            setMensajes((prev) =>
                prev.map((m) =>
                    m.id === mensajeId
                        ? {
                            ...m,
                            estados: (m.estados ?? []).map((s) =>
                                s.usuarioId === usuarioId ? { ...s, leido: true, leidoAt: new Date().toISOString() } : s
                            ),
                        }
                        : m
                )
            );
        };
        socket.on("message_read", onMessageRead);

        return () => {
            socket.off("message", onMessage);
            socket.off("message_read", onMessageRead);
            // opcional: dejar la sala con socket.emit('leave_conversation', conversacionId)
        };
    }, [connected, socket, conversacionId, currentUserId]);

    const onSubmit = async (data: FormValues) => {
        if (!data.contenido || !data.contenido.trim()) return;
        setLoading(true);

        // si no hay socket conectado, fallback a server action existente
        if (!socket || !connected) {
            try {
                const nuevo = await sendMessageAction(conversacionId, currentUserId, data.contenido);
                // mapear y agregar
                const mappedNuevo: Mensaje = {
                    id: nuevo.id,
                    contenido: nuevo.contenido,
                    createdAt:
                        nuevo.createdAt instanceof Date ? nuevo.createdAt.toISOString() : new Date(nuevo.createdAt).toISOString(),
                    autor: { id: nuevo.autor.id, usuario: nuevo.autor.usuario },
                    attachments:
                        nuevo.attachments?.map((a: any) => ({
                            id: a.id,
                            nombre: a.nombre ?? null,
                            url: a.url,
                            tipo: a.tipo ?? null,
                            tamaño: a.tamaño ?? undefined,
                            createdAt:
                                a.createdAt instanceof Date ? a.createdAt.toISOString() : new Date(a.createdAt).toISOString(),
                        })) ?? [],
                    estados:
                        nuevo.estados?.map((e: any) => ({
                            id: e.id,
                            usuarioId: e.usuarioId,
                            entregado: e.entregado,
                            leido: e.leido,
                            entregadoAt: e.entregadoAt
                                ? e.entregadoAt instanceof Date
                                    ? e.entregadoAt.toISOString()
                                    : new Date(e.entregadoAt).toISOString()
                                : null,
                            leidoAt: e.leidoAt
                                ? e.leidoAt instanceof Date
                                    ? e.leidoAt.toISOString()
                                    : new Date(e.leidoAt).toISOString()
                                : null,
                        })) ?? [],
                };
                setMensajes((prev) => [...prev, mappedNuevo]);
                form.reset();
            } catch (err) {
                console.error("Error fallback sendMessage:", err);
            } finally {
                setLoading(false);
            }
            return;
        }

        // Envío por socket con ack: el servidor persistirá y devolverá el mensaje final
        socket.emit(
            "send_message",
            { conversacionId, contenido: data.contenido, attachments: [] },
            (ackResp: any) => {
                setLoading(false);
                if (!ackResp) {
                    console.error("No se recibió ack del socket");
                    return;
                }
                if (ackResp.status === "OK" && ackResp.mensaje) {
                    const m = ackResp.mensaje;
                    const nueva: Mensaje = {
                        id: m.id,
                        contenido: m.contenido,
                        createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : new Date().toISOString(),
                        autor: { id: m.autor?.id ?? m.autorId, usuario: m.autor?.usuario ?? "Desconocido" },
                        attachments:
                            m.attachments?.map((a: any) => ({
                                id: a.id,
                                nombre: a.nombre ?? null,
                                url: a.url,
                                tipo: a.tipo ?? null,
                                tamaño: a.tamaño ?? undefined,
                                createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : new Date().toISOString(),
                            })) ?? [],
                        estados: m.estados ?? [],
                    };

                    // evitar duplicados si el event message también llegará por broadcast
                    setMensajes((prev) => {
                        if (prev.some((x) => x.id === nueva.id)) return prev;
                        return [...prev, nueva];
                    });

                    form.reset();
                } else {
                    console.error("Error al enviar mensaje por socket:", ackResp);
                }
            }
        );
    };

    const formatTime = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
        } catch {
            return "";
        }
    };

    const getStatusIcon = (mensaje: Mensaje) => {
        if (mensaje.autor.id !== currentUserId) return null;
        const estados = mensaje.estados ?? [];
        if (estados.length === 0) return <Check className="w-3 h-3 text-gray-300" />;

        const allDelivered = estados.every((e) => e.entregado);
        const allRead = estados.every((e) => e.leido);

        if (allRead) return <CheckCheck className="w-3 h-3 text-blue-500" />;
        if (allDelivered) return <Check className="w-3 h-3 text-gray-500" />;
        return <Check className="w-3 h-3 text-gray-300" />;
    };

    const initialsFromName = (name: string) => {
        const parts = name.split(" ").filter(Boolean);
        const initials = (parts[0]?.[0] || "?") + (parts[1]?.[0] || "");
        return initials.toUpperCase();
    };

    return (
        <Card className="flex flex-col h-[80vh]">
            <div className="p-4 border-b flex justify-between items-center">
                <div>
                    <h3 className="font-semibold text-lg">Conversación</h3>
                    <p className="text-sm text-muted-foreground">{mensajes.length} mensajes</p>
                </div>
                {/* Aquí agregamos el botón para abrir el diálogo de edición */}
                {tipo === "GROUP" && currentUserId === creadorId && (
                    <EditGroupDialog
                        conversacionId={conversacionId}
                        usuarios={usuarios}
                        participantes={participantes}
                        currentUserId={currentUserId}
                        creadorId={creadorId}
                        nombreActual={nombreActual}
                        onUpdate={(nuevoNombre, nuevosParticipantes) => {
                            // opcional: manejar actualización en tiempo real si deseas
                        }}
                    />
                )}
            </div>

            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                    {mensajes.map((m, index) => {
                        const isCurrentUser = m.autor.id === currentUserId;
                        const showAvatar = index === 0 || mensajes[index - 1]?.autor.id !== m.autor.id;

                        return (
                            <div key={m.id} className={`flex gap-3 ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}>
                                <div className="flex-shrink-0">
                                    {showAvatar ? (
                                        <Avatar className="w-8 h-8">
                                            <AvatarFallback className="text-xs">{m.autor.usuario.charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                    ) : (
                                        <div className="w-8 h-8" />
                                    )}
                                </div>

                                <div className={`max-w-[70%] ${isCurrentUser ? "items-end" : "items-start"} flex flex-col`}>
                                    {showAvatar && (
                                        <div className={`text-xs text-muted-foreground mb-1 ${isCurrentUser ? "text-right" : "text-left"}`}>
                                            {m.autor.usuario}
                                        </div>
                                    )}

                                    <div
                                        className={`rounded-2xl px-4 py-2 ${isCurrentUser ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md"
                                            }`}
                                    >
                                        <p className="text-sm leading-relaxed">{m.contenido}</p>

                                        {m.attachments && m.attachments.length > 0 && (
                                            <div className="mt-2 space-y-1">
                                                {m.attachments.map((a, i) => (
                                                    <Badge key={i} variant="secondary" className="text-xs">
                                                        <Paperclip className="w-3 h-3 mr-1" />
                                                        {a.nombre || "Archivo"}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className={`flex items-center gap-1 mt-1 ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}>
                                        <span className="text-xs text-muted-foreground">{formatTime(m.createdAt)}</span>
                                        {getStatusIcon(m)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>

            <Separator />

            <div className="p-4">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
                        <FormField
                            control={form.control}
                            name="contenido"
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormControl>
                                        <Input placeholder="Escribe un mensaje..." className="rounded-full" {...field} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={loading} size="icon" className="rounded-full">
                            {loading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                    </form>
                </Form>
            </div>
        </Card>
    );
}
