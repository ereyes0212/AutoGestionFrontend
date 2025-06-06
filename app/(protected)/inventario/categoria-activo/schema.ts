import * as z from 'zod';

export const CategoriaActivoSchema = z.object({
  id: z.string().optional(),
  nombre: z.string().min(1, "El nombre es requerido"),
  activo: z.boolean().optional(),
  descripcion: z.string(),
});

export type CategoriaActivo = z.infer<typeof CategoriaActivoSchema>;
