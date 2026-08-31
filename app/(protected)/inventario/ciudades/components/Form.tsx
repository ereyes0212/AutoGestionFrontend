"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CiudadFormData, postCiudad, putCiudad } from "../actions";

export function CiudadFormulario({
  isUpdate,
  initialData,
}: {
  isUpdate: boolean;
  initialData: CiudadFormData;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [nombre, setNombre] = useState(initialData.nombre);
  const [activo, setActivo] = useState(initialData.activo ?? true);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    if (!nombre.trim()) {
      toast({ title: "El nombre es requerido", variant: "destructive" });
      return;
    }

    setGuardando(true);
    try {
      if (isUpdate) {
        await putCiudad({ id: initialData.id, nombre: nombre.trim(), activo });
      } else {
        await postCiudad({ nombre: nombre.trim(), activo });
      }

      toast({
        title: isUpdate ? "Actualización Exitosa" : "Creación Exitosa",
        description: isUpdate ? "La ciudad ha sido actualizada." : "La ciudad ha sido creada.",
      });

      router.push("/inventario/ciudades");
      router.refresh();
    } catch (error) {
      toast({ title: "Error", description: `Hubo un problema: ${error}` });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6 rounded-md border p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Tegucigalpa, San Pedro Sula..."
          />
          <p className="text-xs text-muted-foreground">
            Cada ciudad lleva su propio inventario de insumos.
          </p>
        </div>

        {isUpdate && (
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select
              value={activo ? "true" : "false"}
              onValueChange={(valor) => setActivo(valor === "true")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Activo</SelectItem>
                <SelectItem value="false">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={guardar} disabled={guardando}>
          {guardando ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cargando...
            </>
          ) : isUpdate ? (
            "Actualizar"
          ) : (
            "Crear"
          )}
        </Button>
      </div>
    </div>
  );
}
