import * as z from 'zod';

export const PermisosRolSchema = z.object({
  id: z.string().min(1, "El ID del permiso es requerido"),
  nombre: z.string().min(1, "El nombre del permiso es requerido"),
});

export const RolSchema = z.object({
  id: z.string().optional(),
  nombre: z.string().min(1, "El nombre del rol es requerido"),
  descripcion: z.string().min(1, "La descripción es requerida"),
  activo: z.boolean().default(true),  // Si no se especifica, se asume "activo"
  permisosRol: z.array(PermisosRolSchema), // Array de permisos, obligatorio
});

export type Rol = z.infer<typeof RolSchema>;
export type PermisosRol = z.infer<typeof PermisosRolSchema>;
