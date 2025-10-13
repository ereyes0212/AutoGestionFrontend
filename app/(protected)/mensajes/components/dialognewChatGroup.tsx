"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Usuario } from "../../usuarios/type";
import { createGroupConversation } from "../actions";

interface Props {
    usuarios: Usuario[];
    idUsuarioCreador: string;
}

export default function NewGroupChatDialog({ usuarios, idUsuarioCreador }: Props) {
    const [open, setOpen] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [nombreGrupo, setNombreGrupo] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Manejar selección de usuarios
    const toggleUser = (id: string) => {
        setSelectedUserIds((prev) =>
            prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
        );
    };

    const handleCreateGroup = async () => {
        if (!nombreGrupo.trim()) return alert("El nombre del grupo es requerido");
        if (selectedUserIds.length < 2) return alert("Debes seleccionar al menos 2 usuarios");

        setLoading(true);
        try {
            const conversacion = await createGroupConversation(nombreGrupo, selectedUserIds, idUsuarioCreador);
            if (conversacion) {
                setOpen(false);
                router.push(`/mensajes/${conversacion.id}/mensaje`);
            }
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Error al crear el grupo");
        } finally {
            setLoading(false);
        }
    };

    // Filtrar el creador de la lista de usuarios
    const usuariosFiltrados = usuarios.filter(u => u.id !== idUsuarioCreador);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Nuevo Grupo</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Crear nuevo grupo</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Input
                            placeholder="Nombre del grupo"
                            value={nombreGrupo}
                            onChange={(e) => setNombreGrupo(e.target.value)}
                        />
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2">
                        {usuariosFiltrados.length === 0 ? (
                            <p className="text-sm text-gray-500">No hay usuarios disponibles.</p>
                        ) : (
                            usuariosFiltrados.map((u) => (
                                <div key={u.id} className="flex items-center gap-2">
                                    <Checkbox
                                        checked={selectedUserIds.includes(u.id!)}
                                        onCheckedChange={() => toggleUser(u.id!)}
                                    />
                                    <span>{u.empleado}</span>
                                </div>
                            ))
                        )}
                    </div>

                    <Button onClick={handleCreateGroup} disabled={loading}>
                        {loading ? "Creando..." : "Crear Grupo"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
