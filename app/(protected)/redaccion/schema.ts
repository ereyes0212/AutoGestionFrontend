import * as z from 'zod';

// Enum de estados (igual a Prisma)
export const NotaEstadoEnum = z.enum([
  'PENDIENTE',
  'APROBADA',
  'FINALIZADA',
  'RECHAZADA'
]);

// Tipo de revisión que asigna el jefe al aprobar (igual a Prisma)
export const NotaTipoRevisionEnum = z.enum([
  'PUBLICAR_SIN_REVISION',
  'REVISA_EDITOR',
  'REVISA_JEFE'
]);
export type NotaTipoRevision = z.infer<typeof NotaTipoRevisionEnum>;

// Schema Zod para Nota (coincide con Prisma)
export const NotaSchema = z.object({
  id: z.string().optional(),
  esPrioridad: z.boolean().optional(),              // Boolean @default(false)
  esUltimaHora: z.boolean().optional(),              // Boolean @default(false)
  creadorEmpleadoId: z.string(),                       // String @db.VarChar(36)
  asignadoEmpleadoId: z.string().nullable().optional(),// String? @db.VarChar(36)
  aprobadorEmpleadoId: z.string().nullable().optional(),// String? @db.VarChar(36)
  fuente: z.string().max(250).optional().nullable(),   // String? @db.VarChar(250)
  estado: NotaEstadoEnum,
  tipoRevision: NotaTipoRevisionEnum.nullable().optional(), // NotaTipoRevision?
  descripcion: z.string().min(1, 'La descripción es requerida'), // String @db.LongText
  titulo: z.string().min(1, 'El título es requerido').max(250),
  fellback: z.string().nullable().optional(),          // String? @db.LongText
  createAt: z.date().optional(),                       // DateTime
  updateAt: z.date().optional(),                       // DateTime
});
export type NotaFromSchema = z.infer<typeof NotaSchema>;