import { z } from "zod";


export const EventoSchema = z.object({
    id: z.string().optional(),
    titulo: z.string().min(1, 'El título es requerido').max(250),
    descripcion: z.string().min(1, 'La descripción es requerida'),
    fecha: z.date(),
    ubicacion: z.string().min(1, 'La ubicación es requerida').max(250),
    empleadoId: z.string(),
    facturaAdjunta: z.string().max(500).optional().nullable(),
    notaEnlace: z.string().min(1, 'El enlace de la nota es requerido').max(500),
    monto: z.number().min(0, 'El monto debe ser mayor o igual a 0'),
    createAt: z.date().optional(),
    actualizadoAt: z.date().optional(),
});

export type EventoFromSchema = z.infer<typeof EventoSchema>;