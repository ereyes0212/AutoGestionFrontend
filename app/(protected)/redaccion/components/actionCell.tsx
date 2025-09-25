"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { finalizarNota } from "../actions";
import type { Nota } from "../types";

export function ActionsCell({ nota }: { nota: Nota }) {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = React.useState(false);
    const [open, setOpen] = React.useState(false);

    const handleFinalizar = async () => {
        setLoading(true);
        try {
            const res = await finalizarNota(nota.id!);
            // si usás la versión que devuelve { ok: boolean, error?: string }
            if (!res?.ok) {
                toast({
                    title: "No se pudo finalizar",
                    description: res?.error ?? "Ocurrió un error al finalizar",
                    variant: "destructive",
                });
                return;
            }

            toast({
                title: "Nota finalizada",
                description: "La nota fue finalizada correctamente.",
            });

            // refresca datos (sin reload completo)
            router.refresh();
        } catch (err: any) {
            toast({
                title: "Error inesperado",
                description: String(err?.message ?? err),
                variant: "destructive",
            });
        } finally {
            setLoading(false);
            setOpen(false);
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0" disabled={loading}>
                        <span className="sr-only">Abrir Menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>

                    <Link href={`/redaccion/${nota.id}/edit`}>
                        <DropdownMenuItem asChild>
                            <a>Editar</a>
                        </DropdownMenuItem>
                    </Link>

                    {/* Abrir el dialog desde el item */}
                    <DropdownMenuItem onSelect={(event) => { event.preventDefault(); setOpen(true); }}>
                        Finalizar
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* AlertDialog (confirmación estilo shadcn) */}
            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Finalizar nota</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro que querés finalizar esta nota? Esta acción cambiará su estado a
                            <strong> FINALIZADA</strong>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setOpen(false)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleFinalizar} disabled={loading}>
                            {loading ? "Procesando..." : "Confirmar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
