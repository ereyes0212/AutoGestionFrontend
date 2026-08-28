import * as z from 'zod';

export const UnidadInsumoSchema = z.object({
  id: z.string().optional(),
  nombre: z.string().min(1, "El nombre es requerido"),
  abreviatura: z.string(),
  descripcion: z.string(),
  activo: z.boolean().optional(),
});

export type UnidadInsumo = z.infer<typeof UnidadInsumoSchema>;
