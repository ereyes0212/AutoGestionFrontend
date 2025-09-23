"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createTarea, updateTarea } from "../actions";

type Empleado = {
    id: string;
    nombre: string;
};

type InitialData = {
    id?: string;
    titulo?: string;
    prioridad?: "BAJA" | "MEDIA" | "ALTA" | "URGENTE";
    empleados?: string[];
    fecha?: string | Date;
};

type Props = {
    idEmpleado?: string | string[]; // puede ser uno o varios
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultDate: Date | null;
    empleados: Empleado[];

    mode?: "create" | "edit"; // por defecto create
    initialData?: InitialData; // para prellenar el formulario en edit
    onUpdate?: (payload: {
        id?: string;
        titulo: string;
        prioridad?: InitialData["prioridad"];
        empleados: string[];
        fechaInicio: Date;
        fechaFin: Date;
    }) => Promise<any>;
};

export function CreateTaskDialog({
    idEmpleado,
    open,
    onOpenChange,
    defaultDate,
    empleados,
    mode = "create",
    initialData,
    onUpdate,
}: Props) {
    const [titulo, setTitulo] = useState("");
    const [prioridad, setPrioridad] = useState<"BAJA" | "MEDIA" | "ALTA" | "URGENTE">("MEDIA");
    const [empleadosSeleccionados, setEmpleadosSeleccionados] = useState<string[]>([]);
    const [fecha, setFecha] = useState("");

    const router = useRouter();

    // Helper para inicializar valores por defecto
    const setDefaults = () => {
        setTitulo("");
        setPrioridad("MEDIA");
        // si viene idEmpleado seleccionar automáticamente, si no vacío
        if (idEmpleado) {
            if (Array.isArray(idEmpleado)) setEmpleadosSeleccionados(idEmpleado);
            else setEmpleadosSeleccionados([idEmpleado]);
        } else {
            setEmpleadosSeleccionados([]);
        }
        if (defaultDate) setFecha(defaultDate.toISOString().slice(0, 10));
        else setFecha("");
    };

    // Prefill / reset cada vez que abrimos el dialog o cambian mode/initialData/defaultDate
    useEffect(() => {
        if (!open) {
            // si se cerró el modal, no dejamos estados stale
            setTitulo("");
            setPrioridad("MEDIA");
            setEmpleadosSeleccionados([]);
            setFecha("");
            return;
        }

        // Si abrimos en modo CREATE -> forzamos valores por defecto (evita arrastrar datos)
        if (mode === "create") {
            setDefaults();
            return;
        }

        // Si abrimos en modo EDIT -> prefill desde initialData (cada vez que initialData cambie)
        if (mode === "edit") {
            if (initialData) {
                setTitulo(initialData.titulo ?? "");
                setPrioridad(initialData.prioridad ?? "MEDIA");
                // initialData.empleados puede ser undefined
                setEmpleadosSeleccionados(initialData.empleados ? [...initialData.empleados] : []);
                if (initialData.fecha) {
                    const f = typeof initialData.fecha === "string" ? new Date(initialData.fecha) : initialData.fecha;
                    if (f && !isNaN(f.getTime())) setFecha(f.toISOString().slice(0, 10));
                    else if (defaultDate) setFecha(defaultDate.toISOString().slice(0, 10));
                    else setFecha("");
                } else if (defaultDate) {
                    setFecha(defaultDate.toISOString().slice(0, 10));
                } else {
                    setFecha("");
                }
            } else {
                // modo edit, pero sin initialData: dejamos campos vacíos o por defecto
                setDefaults();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, mode, initialData, defaultDate, idEmpleado]);

    function toggleEmpleado(id: string) {
        setEmpleadosSeleccionados((prev) =>
            prev.includes(id) ? prev.filter((empId) => empId !== id) : [...prev, id]
        );
    }

    async function handleSubmit() {
        try {
            if (!fecha) return;

            const start = new Date(fecha + "T00:00:00");
            const end = new Date(fecha + "T23:59:59");

            const payload = {
                titulo,
                prioridad,
                empleados: empleadosSeleccionados,
                fechaInicio: start,
                fechaFin: end,
            };

            if (mode === "edit") {
                if (onUpdate) {
                    await onUpdate({
                        id: initialData?.id,
                        ...payload,
                    });
                } else if (initialData?.id) {
                    await updateTarea({
                        id: initialData.id,
                        titulo: payload.titulo,
                        fechaInicio: payload.fechaInicio,
                        fechaFin: payload.fechaFin,
                        prioridad: payload.prioridad as any,
                        empleados: payload.empleados,
                    });
                } else {
                    // fallback seguro
                    await createTarea({
                        titulo: payload.titulo,
                        prioridad: payload.prioridad,
                        empleados: payload.empleados,
                        fechaInicio: payload.fechaInicio,
                        fechaFin: payload.fechaFin,
                    });
                }
            } else {
                await createTarea({
                    titulo: payload.titulo,
                    prioridad: payload.prioridad,
                    empleados: payload.empleados,
                    fechaInicio: payload.fechaInicio,
                    fechaFin: payload.fechaFin,
                });
            }

            onOpenChange(false);
            // limpiar solo en create (en edit dejamos el formulario hasta cerrar para no perder trabajo)
            if (mode === "create") {
                setTitulo("");
                setPrioridad("MEDIA");
                setEmpleadosSeleccionados([]);
                setFecha("");
            }

            router.refresh();
        } catch (err) {
            console.error("Error al guardar tarea:", err);
        }
    }

    const titleText = mode === "edit" ? "Editar Tarea" : "Crear Nueva Tarea";
    const buttonText = mode === "edit" ? "Actualizar" : "Guardar";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{titleText}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Label>Título</Label>
                        <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej. Reunión semanal" />
                    </div>

                    <div>
                        <Label>Prioridad</Label>
                        <select
                            value={prioridad}
                            onChange={(e) => setPrioridad(e.target.value as "BAJA" | "MEDIA" | "ALTA" | "URGENTE")}
                            className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                        >
                            <option value="BAJA">Baja</option>
                            <option value="MEDIA">Media</option>
                            <option value="ALTA">Alta</option>
                            <option value="URGENTE">Urgente</option>
                        </select>
                    </div>

                    <div>
                        <Label>Fecha</Label>
                        <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                        <p className="text-xs text-muted-foreground">La tarea ocupará todo el día seleccionado (00:00 a 23:59).</p>
                    </div>

                    <div>
                        <Label>Asignar a empleados</Label>
                        <div className="mt-2 space-y-2 max-h-40 overflow-y-auto rounded-md border p-2">
                            {empleados.map((emp) => (
                                <div key={emp.id} className="flex items-center space-x-2">
                                    <Checkbox checked={empleadosSeleccionados.includes(emp.id)} onCheckedChange={() => toggleEmpleado(emp.id)} />
                                    <span className="text-sm">{emp.nombre}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit}>{buttonText}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
