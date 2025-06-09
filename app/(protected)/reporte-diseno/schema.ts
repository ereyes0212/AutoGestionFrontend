
import { z } from "zod";

// Zod schema for the DTO of ReporteDiseño, using native date transformations
export const ReporteDisenoDTOSchema = z
  .object({
    SeccionId: z.string().optional(),
    PaginaInicio: z
      .number({ invalid_type_error: "PaginaInicio debe ser un número" })
      .int("PaginaInicio debe ser un entero")
      .min(1, "PaginaInicio debe ser al menos 1"),
    PaginaFin: z
      .number({ invalid_type_error: "PaginaFin debe ser un número" })
      .int("PaginaFin debe ser un entero")
      .min(1, "PaginaFin debe ser al menos 1"),
    HoraInicio: z
      .string()
      .regex(
        /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/,
        "HoraInicio debe tener formato HH:MM:SS"
      ),
    HoraFin: z
      .string()
      .regex(
        /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/,
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

export type ReporteDisenoDTO = z.infer<typeof ReporteDisenoDTOSchema>;