import * as z from 'zod';

export const AjusteTipoSchema = z.object({
  id: z.string().optional(),
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string(),
  categoria: z.enum(["DEDUCCION", "BONO"]),
  montoPorDefecto: z
    .number({ invalid_type_error: "El monto por defecto debe ser un número" })
    .nonnegative("El monto por defecto no puede ser negativo"),
  activo: z.boolean().optional(),
});

export type AjusteTipo = z.infer<typeof AjusteTipoSchema>;
