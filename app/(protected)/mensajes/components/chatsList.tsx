"use client"

import { useRouter } from "next/navigation"
import type { ChatListItem } from "../type"

// shadcn components
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface Props {
    chats: ChatListItem[]
    currentUserId: string
}

export default function ChatListClient({ chats, currentUserId }: Props) {
    const router = useRouter()

    function otherParticipantName(item: ChatListItem) {
        if (item.tipo === "GROUP") return item.nombre ?? "Grupo"
        const other = item.participantes.find((p) => p.id !== currentUserId)
        return other ? other.usuario : "Desconocido"
    }

    function initialsFromName(name: string) {
        const parts = name.split(" ").filter(Boolean)
        const initials = (parts[0]?.[0] || "?") + (parts[1]?.[0] || "")
        return initials.toUpperCase()
    }

    function formatTime(dateString: string) {
        const date = new Date(dateString)
        const now = new Date()
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

        if (diffInHours < 24) {
            return date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
        } else {
            return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" })
        }
    }

    return (
        <div className="w-full  mx-auto p-4">


            <div className="space-y-2">
                {chats.length === 0 ? (
                    // Enhanced empty state with Card
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <div className="text-center">
                                <h3 className="text-lg font-semibold">No hay conversaciones</h3>
                                <p className="text-muted-foreground mt-1">Inicia una nueva conversación</p>

                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    chats.map((c, index) => {
                        const name = otherParticipantName(c)
                        const lastMsg = c.lastMessage
                        const isGroup = c.tipo === "GROUP"
                        const hasUnread = c.unreadCount > 0

                        return (
                            <div key={c.id}>
                                <Card className="transition-colors hover:bg-muted/50">
                                    <CardContent className="p-0">
                                        <Button
                                            variant="ghost"
                                            className="w-full h-auto p-4 justify-start"
                                            onClick={() => router.push(`/mensajes/${c.id}/mensaje`)}
                                        >
                                            <div className="flex items-center gap-3 w-full">
                                                <Avatar className="w-12 h-12">
                                                    <AvatarFallback
                                                        className={isGroup ? "bg-purple-500 text-white" : "bg-primary text-primary-foreground"}
                                                    >
                                                        {initialsFromName(name)}
                                                    </AvatarFallback>
                                                </Avatar>

                                                <div className="flex-1 min-w-0 text-left">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h3 className={`font-medium truncate ${hasUnread ? "font-semibold" : ""}`}>{name}</h3>

                                                        <div className="flex items-center gap-2">
                                                            {lastMsg && lastMsg.createdAt && (
                                                                <span className="text-xs text-muted-foreground">{formatTime(lastMsg.createdAt)}</span>
                                                            )}
                                                            {hasUnread && (
                                                                <Badge variant="default" className="text-xs min-w-[20px] h-5">
                                                                    {c.unreadCount > 9 ? "9+" : c.unreadCount}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <p className="text-sm text-muted-foreground truncate">
                                                        {lastMsg ? lastMsg.contenido : "Conversación iniciada"}
                                                    </p>
                                                </div>
                                            </div>
                                        </Button>
                                    </CardContent>
                                </Card>

                                {index < chats.length - 1 && <Separator className="my-1" />}
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
