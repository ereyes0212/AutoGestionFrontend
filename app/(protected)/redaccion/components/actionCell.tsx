"use client";

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
import { finalizarNota } from "../actions";
import { Nota } from "../types";

// Componente React para la celda de acciones
export function ActionsCell({ nota }: { nota: Nota }) {
    const router = useRouter();
    const { toast } = useToast();

    const handleFinalizar = async () => {
        try {
            await finalizarNota(nota.id!);
            toast({
                title: "Nota finalizada",
                description: "La nota ha sido finalizada exitosamente.",
            });
            router.refresh(); // refresca datos sin recargar
        } catch (err: any) {
            toast({
                title: "Error",
                description: String(err.message || err),
                variant: "destructive",
            });
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Abrir Menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>

                <Link href={`/redaccion/${nota.id}/edit`}>
                    <DropdownMenuItem>Editar</DropdownMenuItem>
                </Link>

                <DropdownMenuItem onClick={handleFinalizar}>Finalizar</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}