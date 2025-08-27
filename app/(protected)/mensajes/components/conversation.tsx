"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, CheckCheck, Paperclip, Send } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { sendMessage } from "../actions"

export type Mensaje = {
    id: string
    contenido: string
    createdAt: string
    autor: {
        id: string
        usuario: string
    }
    attachments?: {
        id: string
        nombre: string | null
        url: string
        tipo?: string | null
        tamaño?: number | null
        createdAt: string
    }[]
    estados?: {
        id: string
        usuarioId: string
        entregado: boolean
        leido: boolean
        entregadoAt?: string | null
        leidoAt?: string | null
    }[]
}

const schema = z.object({
    contenido: z.string().min(1, "No puede estar vacío"),
})

type FormValues = z.infer<typeof schema>

export function ChatConversation({
    conversacionId,
    currentUserId,
    initialMessages,
}: {
    conversacionId: string
    currentUserId: string
    initialMessages: any[]
}) {
    const mappedMensajes: Mensaje[] = initialMessages.map((m) => ({
        id: m.id,
        contenido: m.contenido,
        createdAt: m.createdAt.toISOString(),
        autor: {
            id: m.autor.id,
            usuario: m.autor.usuario,
        },
        attachments: m.attachments?.map((a: { id: any; nombre: any; url: any; tipo: any; tamaño: any; createdAt: { toISOString: () => any } }) => ({
            id: a.id,
            nombre: a.nombre,
            url: a.url,
            tipo: a.tipo,
            tamaño: a.tamaño ?? undefined,
            createdAt: a.createdAt.toISOString(),
        })),
        estados: m.estados?.map((e: { id: any; usuarioId: any; entregado: any; leido: any; entregadoAt: { toISOString: () => any }; leidoAt: { toISOString: () => any } }) => ({
            id: e.id,
            usuarioId: e.usuarioId,
            entregado: e.entregado,
            leido: e.leido,
            entregadoAt: e.entregadoAt?.toISOString() ?? null,
            leidoAt: e.leidoAt?.toISOString() ?? null,
        })),
    }))

    const [mensajes, setMensajes] = useState<Mensaje[]>(mappedMensajes)

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { contenido: "" },
    })

    const [loading, setLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [mensajes])

    const onSubmit = async (data: FormValues) => {
        setLoading(true)
        try {
            const nuevo = await sendMessage(conversacionId, currentUserId, data.contenido)

            const mappedNuevo: Mensaje = {
                id: nuevo.id,
                contenido: nuevo.contenido,
                createdAt: nuevo.createdAt.toISOString(),
                autor: {
                    id: nuevo.autor.id,
                    usuario: nuevo.autor.usuario,
                },
                attachments: nuevo.attachments?.map((a) => ({
                    id: a.id,
                    nombre: a.nombre,
                    url: a.url,
                    tipo: a.tipo,
                    tamaño: a.tamaño ?? undefined,
                    createdAt: a.createdAt.toISOString(),
                })),
                estados: nuevo.estados?.map((e) => ({
                    id: e.id,
                    usuarioId: e.usuarioId,
                    entregado: e.entregado,
                    leido: e.leido,
                    entregadoAt: e.entregadoAt?.toISOString() ?? null,
                    leidoAt: e.leidoAt?.toISOString() ?? null,
                })),
            }

            setMensajes([...mensajes, mappedNuevo])
            form.reset()
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const getStatusIcon = (mensaje: Mensaje) => {
        if (mensaje.autor.id !== currentUserId) return null

        const allDelivered = mensaje.estados?.every((e) => e.entregado)
        const allRead = mensaje.estados?.every((e) => e.leido)

        if (allRead) return <CheckCheck className="w-3 h-3 text-blue-500" />
        if (allDelivered) return <Check className="w-3 h-3 text-gray-500" />
        return <Check className="w-3 h-3 text-gray-300" />
    }

    return (
        <Card className="flex flex-col h-[80vh]">
            <div className="p-4 border-b">
                <h3 className="font-semibold text-lg">Conversación</h3>
                <p className="text-sm text-muted-foreground">{mensajes.length} mensajes</p>
            </div>

            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                    {mensajes.map((m, index) => {
                        const isCurrentUser = m.autor.id === currentUserId
                        const showAvatar = index === 0 || mensajes[index - 1]?.autor.id !== m.autor.id

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
                        )
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
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </Button>
                    </form>
                </Form>
            </div>
        </Card>
    )
}
