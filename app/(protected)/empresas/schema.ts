import * as z from 'zod';

export const EmpresaSchema = z.object({
  id: z.string().optional(),
  nombre: z.string().min(1, "El nombre es requerido"),
  activo: z.boolean().optional(), 
  });

export type Empleado = z.infer<typeof EmpresaSchema>;
