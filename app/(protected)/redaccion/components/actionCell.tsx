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
import { aprobarNota, finalizarNota } from "../actions";
import type { Nota } from "../types";

export function ActionsCell({ nota }: { nota: Nota }) {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = React.useState(false);
    const [openFinalizar, setOpenFinalizar] = React.useState(false);
    const [openAprobar, setOpenAprobar] = React.useState(false);

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
            setOpenFinalizar(false);
        }
    };

    const handleAprobar = async () => {
        setLoading(true);
        try {
            const res = await aprobarNota(nota.id!, "APROBADA", null);
            // seguir el mismo patrón de respuesta que finalizarNota
            if (!res?.ok) {
                toast({
                    title: "No se pudo aprobar",
                    description: res?.error ?? "Ocurrió un error al aprobar",
                    variant: "destructive",
                });
                return;
            }

            toast({
                title: "Nota aprobada",
                description: "La nota fue aprobada correctamente.",
            });

            router.refresh();
        } catch (err: any) {
            toast({
                title: "Error al aprobar",
                description: String(err?.message ?? err),
                variant: "destructive",
            });
        } finally {
            setLoading(false);
            setOpenAprobar(false);
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

                    <DropdownMenuItem
                        onSelect={(event) => {
                            event.preventDefault();
                            setOpenFinalizar(true);
                        }}
                    >
                        Finalizar
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onSelect={(event) => {
                            event.preventDefault();
                            setOpenAprobar(true);
                        }}
                    >
                        Aprobar
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Dialog Finalizar */}
            <AlertDialog open={openFinalizar} onOpenChange={setOpenFinalizar}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Finalizar nota</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro que querés finalizar esta nota? Esta acción cambiará su estado a <strong>FINALIZADA</strong>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setOpenFinalizar(false)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleFinalizar} disabled={loading}>
                            {loading ? "Procesando..." : "Confirmar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dialog Aprobar */}
            <AlertDialog open={openAprobar} onOpenChange={setOpenAprobar}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Aprobar nota</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Confirmás aprobar esta nota? Esta acción cambiará su estado a <strong>APROBADA</strong>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setOpenAprobar(false)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleAprobar} disabled={loading}>
                            {loading ? "Procesando..." : "Confirmar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
