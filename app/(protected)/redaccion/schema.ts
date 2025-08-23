import * as z from 'zod';

// Enum de estados (igual a Prisma)
export const NotaEstadoEnum = z.enum([
  'PENDIENTE',
  'APROBADA',
  'FINALIZADA',
  'RECHAZADA',
  'REVISION',
]);

// Schema Zod para Nota (coincide con Prisma)
export const NotaSchema = z.object({
  id: z.string().optional(),
  creadorEmpleadoId: z.string(),                       // String @db.VarChar(36)
  asignadoEmpleadoId: z.string().nullable().optional(),// String? @db.VarChar(36)
  aprobadorEmpleadoId: z.string().nullable().optional(),// String? @db.VarChar(36)
  estado: NotaEstadoEnum,
  titulo: z.string().min(1, 'El título es requerido').max(250),
  fellback: z.string().nullable().optional(),          // String? @db.LongText
  createAt: z.date().optional(),                       // DateTime
  updateAt: z.date().optional(),                       // DateTime
});
export type NotaFromSchema = z.infer<typeof NotaSchema>;