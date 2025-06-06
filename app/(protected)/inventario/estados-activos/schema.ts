import * as z from 'zod';

export const EstadoActivoSchema = z.object({
  id: z.string().optional(),
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string(),
});

export type EstadoActivo = z.infer<typeof EstadoActivoSchema>;
