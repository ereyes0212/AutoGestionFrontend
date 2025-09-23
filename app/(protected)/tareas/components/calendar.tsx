"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EventClickArg } from "@fullcalendar/core";
import esLocale from "@fullcalendar/core/locales/es";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, { DateClickArg } from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { TaskCard } from "./cardTarea";

import { completeTarea, updateTarea } from "../actions";
import type { Tarea as TareaShared } from "../types";
import { CreateTaskDialog } from "./createTarea";

// ---------- Helpers ----------
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const isBetweenInclusive = (date: Date, start: Date, end?: Date | null) => {
    const t = startOfDay(date).getTime();
    const s = startOfDay(start).getTime();
    const e = end ? startOfDay(end).getTime() : s;
    return t >= s && t <= e;
};

function normalizeDate(value: unknown): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === "string" || typeof value === "number") {
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d;
    }
    return null;
}

// ---------- Componente principal ----------
export default function CalendarWithSheet({
    idEmpleado,
    tareas,
    empleados,
}: {
    tareas: unknown[];
    idEmpleado: string;
    empleados: { id: string; nombre: string }[];
}) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // Crear / Edit dialog
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
    const [initialData, setInitialData] = useState<any | undefined>(undefined);

    const tareasNorm = useMemo(() => {
        return (tareas || []).map((t: any) => {
            const fechaInicio = normalizeDate(t?.fechaInicio);
            const fechaFin = t?.fechaFin ? normalizeDate(t?.fechaFin) : null;

            return {
                ...t,
                fechaInicio: fechaInicio as Date,
                fechaFin: fechaFin as Date | null,
            };
        }) as TareaShared[];
    }, [tareas]);

    const tareasDelDia = useMemo(() => {
        if (!selectedDate) return [] as TareaShared[];
        return tareasNorm.filter((t) => {
            const start = t.fechaInicio as Date;
            const end = (t as any).fechaFin as Date | null;
            if (!start) return false;
            return isBetweenInclusive(selectedDate, start, end);
        });
    }, [selectedDate, tareasNorm]);

    function openForDate(date: Date) {
        setSelectedDate(startOfDay(date));
        setIsOpen(true);
    }

    function handleView(t: TareaShared) {
        console.log("Ver tarea", t.id);
        setIsOpen(false);
    }

    function handleComplete(t: TareaShared) {
        completeTarea(t.id).then(() => {
            setIsOpen(false);
            router.refresh();
        });
    }

    // abrir diálogo en modo crear
    function handleCreateClick() {
        setDialogMode("create");
        setInitialData(undefined);
        setOpenDialog(true);
    }

    // abrir diálogo en modo editar (llamado desde TaskCard)
    function handleEdit(t: TareaShared) {
        setDialogMode("edit");

        // obtener ids de empleados: preferimos t.empleados si existe, si no, extraemos desde asignaciones
        const empleadosFromTarea: string[] =
            ((t as any).empleados as string[] | undefined) ??
            (t.asignaciones?.map((a: any) => a.empleadoId) ?? []);

        const mapped = {
            id: t.id,
            titulo: t.titulo,
            prioridad: (t.prioridad as any) || "MEDIA",
            empleados: empleadosFromTarea,
            fecha: t.fechaInicio ?? t.fechaFin ?? null,
        };

        setInitialData(mapped);
        setOpenDialog(true);
    }


    // onUpdate que pasamos al dialog (usa tu server action updateTarea)
    async function handleUpdate(payload: {
        id?: string;
        titulo: string;
        prioridad?: "BAJA" | "MEDIA" | "ALTA" | "URGENTE";
        empleados: string[];
        fechaInicio: Date;
        fechaFin: Date;
    }) {
        try {
            if (!payload.id) throw new Error("No se recibió id para actualizar.");

            await updateTarea({
                id: payload.id,
                titulo: payload.titulo,
                fechaInicio: payload.fechaInicio,
                fechaFin: payload.fechaFin,
                prioridad: payload.prioridad,
                empleados: payload.empleados,
            });

            setOpenDialog(false);
            router.refresh();
        } catch (err) {
            console.error("Error actualizando tarea:", err);
            throw err;
        }
    }

    return (
        <div className="rounded-xl shadow p-4">
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                locale={esLocale}
                headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right: "dayGridMonth,timeGridWeek,timeGridDay",
                }}

                selectable
                events={tareasNorm.map((t) => ({
                    id: t.id,
                    title: t.titulo,
                    start: t.fechaInicio,
                    end: (t as any).fechaFin || undefined,
                    allDay: !!(t as any).todoDia,
                    extendedProps: {
                        estado: (t as any).estado,
                        prioridad: (t as any).prioridad,
                    },
                }))}
                dateClick={(arg: DateClickArg) => openForDate(arg.date)}
                eventClick={(arg: EventClickArg) => {
                    const evStart = arg.event.start;
                    if (evStart) openForDate(evStart);
                }}
                dayMaxEvents={2}
                eventContent={(arg) => {
                    const prioridad = arg.event.extendedProps["prioridad"];
                    const color =
                        prioridad === "URGENTE" ? "bg-red-500" : prioridad === "ALTA" ? "bg-orange-500" : prioridad === "MEDIA" ? "bg-blue-500" : "bg-gray-400";

                    return (
                        <div className={`px-2 py-1 bg-primarya rounded-md text-xs text-white shadow ${color}`}>
                            {arg.event.title}
                        </div>
                    );
                }}
                dayCellDidMount={(info) => {
                    info.el.classList.add("bg-background", "borders", "border-border", "rounded-lg", "overflow-hidden", "transition-colors");
                }}
                contentHeight="auto"
                aspectRatio={5.5}
            />

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetContent side="right" className="w-full max-w-md">
                    <SheetHeader>
                        <SheetTitle>
                            {selectedDate
                                ? selectedDate.toLocaleDateString("es-ES", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                })
                                : "Tareas"}
                        </SheetTitle>
                        <SheetDescription>Lista de tareas para la fecha seleccionada.</SheetDescription>
                    </SheetHeader>

                    <div className="mt-4 grid gap-3 overflow-y-auto max-h-[65vh]">
                        {tareasDelDia.length === 0 ? (
                            <div className="text-sm text-muted-foreground">No hay tareas para este día.</div>
                        ) : (
                            tareasDelDia.map((t) => (
                                <TaskCard key={t.id} tarea={t} onView={handleView} onComplete={handleComplete} onEdit={handleEdit} />
                            ))
                        )}
                    </div>

                    <div className="mt-4 flex justify-between">
                        <Button variant="outline" onClick={handleCreateClick}>
                            Crear Tarea
                        </Button>
                        <Button variant="ghost" onClick={() => setIsOpen(false)}>
                            Cerrar
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            <CreateTaskDialog
                idEmpleado={idEmpleado}
                empleados={empleados}
                open={openDialog}
                onOpenChange={setOpenDialog}
                defaultDate={selectedDate}
                mode={dialogMode}
                initialData={initialData}
                onUpdate={handleUpdate}
            />
        </div>
    );
}
