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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { aprobarNota, finalizarNota } from "../actions";
import type { Nota } from "../types";

export function ActionsCell({
    nota,
    puedeCambiarEstado = false,
}: {
    nota: Nota;
    puedeCambiarEstado?: boolean;
}) {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = React.useState(false);
    const [openFinalizar, setOpenFinalizar] = React.useState(false);
    const [openAprobar, setOpenAprobar] = React.useState(false);
    const [openRechazar, setOpenRechazar] = React.useState(false);
    const [feedback, setFeedback] = React.useState("");

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

    const handleRechazar = async () => {
        setLoading(true);
        try {
            // el feedback es opcional: si queda vacío se guarda null
            const res = await aprobarNota(nota.id!, "RECHAZADA", feedback.trim() || null);
            if (!res?.ok) {
                toast({
                    title: "No se pudo rechazar",
                    description: res?.error ?? "Ocurrió un error al rechazar",
                    variant: "destructive",
                });
                return;
            }

            toast({
                title: "Nota rechazada",
                description: "La nota fue rechazada correctamente.",
            });

            setFeedback("");
            setOpenRechazar(false);
            router.refresh();
        } catch (err: any) {
            toast({
                title: "Error al rechazar",
                description: String(err?.message ?? err),
                variant: "destructive",
            });
        } finally {
            setLoading(false);
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

                    {puedeCambiarEstado && (
                        <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onSelect={(event) => {
                                event.preventDefault();
                                setOpenRechazar(true);
                            }}
                        >
                            Rechazar
                        </DropdownMenuItem>
                    )}
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

            {/* Dialog Rechazar (solo con permiso cambiar_estado_notas) */}
            <Dialog
                open={openRechazar}
                onOpenChange={(open) => {
                    if (loading) return;
                    setOpenRechazar(open);
                    if (!open) setFeedback("");
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rechazar nota</DialogTitle>
                        <DialogDescription>
                            Podés dejar un feedback para el creador de la nota. Esta acción cambiará su estado a <strong>DESCARTADA</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                        <Label htmlFor="feedback-rechazo">Feedback (opcional)</Label>
                        <Textarea
                            id="feedback-rechazo"
                            placeholder="Escribí el motivo del rechazo (podés dejarlo vacío)"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            rows={4}
                            disabled={loading}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setOpenRechazar(false);
                                setFeedback("");
                            }}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleRechazar} disabled={loading}>
                            {loading ? "Procesando..." : "Rechazar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
