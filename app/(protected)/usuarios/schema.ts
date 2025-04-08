import { z } from "zod";

// Esquema para validación de usuario
export const UsuarioSchema = z.object({
  id: z.string().optional(),
  usuario: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres"),
  contrasena: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional(),
  empleado_id: z.string().uuid("Empleado ID debe ser un UUID válido"),
  role_id: z.string().uuid("Role ID debe ser un UUID válido"),
  activo: z.boolean().optional(),
});
