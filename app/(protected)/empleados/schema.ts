import * as z from 'zod';

export const EmpleadoSchema = z.object({
  id: z.string().optional(), // Campo opcional para manejar clientes existentes
  nombre: z.string().min(1, "El nombre es requerido"),
  apellido: z.string().min(1, "El apellido es requerido"),
  correo: z.string().email("Correo no válido"),
  genero: z.string().min(1, "El género es requerido"),
  activo: z.boolean().optional().default(true),
  usuarioNombre: z.string().optional().nullable(),
  edad: z.number().min(18, "La edad debe ser mayor o igual a 18 años").max(100, "La edad debe ser menor o igual a 100 años"), // Validación de edad
});

export type Empleado = z.infer<typeof EmpleadoSchema>;
