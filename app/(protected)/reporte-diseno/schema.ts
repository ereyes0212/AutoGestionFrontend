import { z } from "zod";

// Esquema Zod para el DTO de ReporteDiseño con claves PascalCase
export const ReporteDisenoDTOSchema = z
  .object({
    SeccionId: z.string().uuid("SeccionId debe ser un UUID válido"),
    PaginaInicio: z
      .string(),
    PaginaFin: z
      .string(),
    HoraInicio: z
      .string()
      .regex(
        /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/,
        "HoraInicio debe tener formato HH:MM:SS"
      ),
    HoraFin: z
      .string()
      .regex(
        /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/,
        "HoraFin debe tener formato HH:MM:SS"
      ),
    Observacion: z.string().optional(),
  })
  .refine(
    (data) => data.PaginaFin >= data.PaginaInicio,
    {
      path: ["PaginaFin"],
      message: "PaginaFin debe ser mayor o igual a PaginaInicio",
    }
  );
