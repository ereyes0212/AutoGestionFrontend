import * as z from 'zod';

export const EmpresaSchema = z.object({
  id: z.string().min(1, "El ID de la empresa es requerido"),
  nombre: z.string().min(1, "El nombre de la empresa es requerido"),
});

export const EmpleadoSchema = z.object({
  id: z.string().optional(), // Campo opcional para manejar clientes existentes
  nombre: z.string().min(1, "El nombre es requerido"),
  apellido: z.string().min(1, "El apellido es requerido"),
  correo: z.string().email("Correo no válido"),
  genero: z.string().min(1, "El género es requerido"),
  activo: z.boolean().optional(), 
  usuarioNombre: z.string().optional().nullable(),
  empresas: z.array(EmpresaSchema).optional(), // Lista de empresas asociadas al empleado
  puesto_id: z.string(),
  jefe_id: z.string(),
  fechaNacimiento: z.date(),
  vacaciones: z.number().min(0, "Las vacaciones no pueden ser negativas").optional(),
});

export type Empleado = z.infer<typeof EmpleadoSchema>;
export type Empresa = z.infer<typeof EmpresaSchema>;
