import { z } from "zod";

export const activoSchema = z.object({
    id: z.string().optional(),
    codigoBarra: z.string(),
    nombre: z.string().min(1, "El nombre es requerido"),
    descripcion: z.string().min(1, "La descripción es requerida"),
    categoriaId: z.string().min(1, "La categoría es requerida"),
    empleadoAsignadoId: z.string().min(1, "El empleado asignado es requerido"),
    fechaAsignacion: z.date(),
    fechaRegistro: z.date(),
    estadoActualId: z.string().min(1, "El estado actual es requerido"),
    activo: z.boolean()
});

export type ActivoFormValues = z.infer<typeof activoSchema>; 