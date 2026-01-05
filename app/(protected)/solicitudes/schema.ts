import * as z from 'zod';



export const SolicitudSchema = z.object({
  id: z.string(), // Campo opcional para manejar solicitudes existentes
  fechaInicio: z.date(),
  fechaFin: z.date(),
  descripcion: z.string(),
  tipoSolicitud: z.enum(["VACACION", "DIACOMPENSATORIO", "MIXTO"]).default("VACACION"),
});

export type Solicitud = z.infer<typeof SolicitudSchema>;
