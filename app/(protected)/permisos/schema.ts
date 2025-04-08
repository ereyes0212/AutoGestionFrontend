import * as z from 'zod';

export const PermisoSchema = z.object({
  id: z.string().optional(),
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().min(1,"descripcion es requerida"),
  activo: z.boolean().default(true),  // Usado solo para actualizaciones
});

export type Permiso = z.infer<typeof PermisoSchema>;
