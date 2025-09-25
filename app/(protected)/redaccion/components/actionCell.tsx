"use client";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { finalizarNota } from "../actions";
import type { Nota } from "../types";
// IMPORTÁ la action server aquí (Next la convierte en llamada remota)

export function ActionsCell({ nota }: { nota: Nota }) {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = React.useState(false);

    const handleFinalizar = async () => {
        if (!confirm("¿Seguro que querés finalizar la nota?")) return;
        try {
            setLoading(true);
            await finalizarNota(nota.id!);
            toast({ title: "Nota finalizada" });
            router.refresh();
        } catch (err: any) {
            toast({ title: "Error", description: String(err?.message ?? err), variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0" disabled={loading}>
                    <span className="sr-only">Abrir Menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <Link href={`/redaccion/${nota.id}/edit`}><DropdownMenuItem asChild><a>Editar</a></DropdownMenuItem></Link>
                <DropdownMenuItem onClick={handleFinalizar}>Finalizar</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
