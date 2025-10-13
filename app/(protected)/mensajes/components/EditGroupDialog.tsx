"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@radix-ui/react-separator";

import { Usuario } from "../../usuarios/type";
import { addUsersToGroup, removeUsersFromGroup, updateGroupName } from "../actions";

interface Props {
    conversacionId: string;
    usuarios: Usuario[];
    participantes: Usuario[];
    creadorId: string;
    currentUserId: string;
    nombreActual: string;
    onUpdate?: (nuevoNombre: string, nuevosParticipantes: Usuario[]) => void;
}

const schema = z.object({
    nombre: z.string().min(1, "El nombre es obligatorio"),
});

export default function EditGroupDialog({
    conversacionId,
    usuarios,
    participantes,
    currentUserId,
    creadorId,
    nombreActual,
    onUpdate,
}: Props) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const form = useForm<{ nombre: string }>({
        resolver: zodResolver(schema),
        defaultValues: { nombre: nombreActual },
    });
    const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);
    const [selectedToRemove, setSelectedToRemove] = useState<string[]>([]);

    const router = useRouter(); // Hook de Next.js para refrescar

    const handleSaveNombre = async (data: { nombre: string }) => {
        try {
            setLoading(true);
            await updateGroupName(conversacionId, data.nombre);
            form.reset({ nombre: data.nombre });
            onUpdate?.(data.nombre, participantes);
            setOpen(false);
            router.refresh(); // <-- Refresca la página actual
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddUsers = async () => {
        if (!selectedToAdd.length) return;
        try {
            setLoading(true);
            await addUsersToGroup(conversacionId, selectedToAdd);
            onUpdate?.(form.getValues("nombre"), [
                ...participantes,
                ...usuarios.filter((u) => selectedToAdd.includes(u.id!)),
            ]);
            setSelectedToAdd([]);
            setOpen(false);
            router.refresh(); // <-- Refresca la página actual
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveUsers = async () => {
        if (!selectedToRemove.length) return;
        try {
            setLoading(true);
            await removeUsersFromGroup(conversacionId, selectedToRemove);
            onUpdate?.(
                form.getValues("nombre"),
                participantes.filter((p) => !selectedToRemove.includes(p.id!))
            );
            setSelectedToRemove([]);
            setOpen(false);
            router.refresh(); // <-- Refresca la página actual
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const availableToAdd = usuarios.filter(
        (u) => !participantes.some((p) => p.id === u.id) && u.id !== creadorId
    );
    const availableToRemove = participantes.filter((p) => p.id !== creadorId);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                    •••
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl p-4">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Editar grupo</DialogTitle>
                </DialogHeader>

                {/* Fila superior: Nombre */}
                <div className="mb-4 p-4 border rounded-md">
                    <h4 className="font-semibold mb-2">Nombre del grupo</h4>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSaveNombre)} className="flex gap-2">
                            <FormField
                                control={form.control}
                                name="nombre"
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormControl>
                                            <Input {...field} placeholder="Nuevo nombre" />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={loading}>
                                Guardar
                            </Button>
                        </form>
                    </Form>
                </div>

                {/* Fila inferior: Agregar y Expulsar */}
                <div className="flex gap-4">
                    {/* Agregar usuarios */}
                    <div className="flex-1 p-4 border rounded-md flex flex-col">
                        <h4 className="font-semibold mb-2">Agregar usuarios</h4>
                        <Separator className="mb-2" />
                        <div className="flex-1 overflow-y-auto max-h-72 space-y-2">
                            {availableToAdd.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No hay usuarios</p>
                            ) : (
                                availableToAdd.map((u) => (
                                    <div key={u.id} className="flex items-center justify-between">
                                        <span>{u.empleado}</span>
                                        <Checkbox
                                            checked={selectedToAdd.includes(u.id!)}
                                            onCheckedChange={(val) =>
                                                setSelectedToAdd((prev) =>
                                                    val ? [...prev, u.id!] : prev.filter((id) => id !== u.id)
                                                )
                                            }
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                        {availableToAdd.length > 0 && (
                            <Button className="mt-2" onClick={handleAddUsers} disabled={loading}>
                                Agregar seleccionados
                            </Button>
                        )}
                    </div>

                    {/* Expulsar usuarios */}
                    <div className="flex-1 p-4 border rounded-md flex flex-col">
                        <h4 className="font-semibold mb-2 text-destructive">Expulsar usuarios</h4>
                        <Separator className="mb-2" />
                        <div className="flex-1 overflow-y-auto max-h-72 space-y-2">
                            {availableToRemove.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No hay usuarios</p>
                            ) : (
                                availableToRemove.map((u) => (
                                    <div key={u.id} className="flex items-center justify-between">
                                        <span>{u.empleado}</span>
                                        <Checkbox
                                            checked={selectedToRemove.includes(u.id!)}
                                            onCheckedChange={(val) =>
                                                setSelectedToRemove((prev) =>
                                                    val ? [...prev, u.id!] : prev.filter((id) => id !== u.id)
                                                )
                                            }
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                        {availableToRemove.length > 0 && (
                            <Button
                                className="mt-2"
                                variant="destructive"
                                onClick={handleRemoveUsers}
                                disabled={loading}
                            >
                                Expulsar seleccionados
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
