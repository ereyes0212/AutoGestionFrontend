import * as z from 'zod';



export const SolicitudSchema = z.object({
  id: z.string().optional(), // Campo opcional para manejar solicitudes existentes
  fechaInicio: z.date(),
  fechaFin: z.date(),
  descripcion: z.string(),
  tipoSolicitud: z.enum(["VACACION", "DIACOMPENSATORIO", "MIXTO"])
});

export type Solicitud = z.infer<typeof SolicitudSchema>;
