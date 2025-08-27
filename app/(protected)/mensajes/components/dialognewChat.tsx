"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Usuario } from "../../usuarios/type";
import { createPrivateConversation } from "../actions";

interface Props {
    usuarios: Usuario[];
    idUsuarioCreador: string;
}

export default function NewChatDialog({ usuarios, idUsuarioCreador }: Props) {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const handleStartChat = async (idUsuarioDestino: string) => {
        const conversacion = await createPrivateConversation(idUsuarioCreador, idUsuarioDestino);
        if (conversacion && conversacion.conversacion) {
            setOpen(false);
            router.push(`/mensajes/${conversacion.conversacion.id}/mensaje`); // 👈 Redirige directamente a la conversación
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Nuevo Mensaje</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Iniciar nueva conversación</DialogTitle>
                </DialogHeader>
                <div className="space-y-2">
                    {usuarios.length === 0 ? (
                        <p className="text-sm text-gray-500">No hay usuarios disponibles.</p>
                    ) : (
                        usuarios.map((u) => (
                            <Button
                                key={u.id}
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => handleStartChat(u.id!)}
                            >
                                {u.empleado}
                            </Button>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
