import * as z from "zod";

export const InsumoSchema = z
  .object({
    id: z.string().optional(),
    nombre: z.string().min(1, "El nombre es requerido"),
    descripcion: z.string(),
    unidadId: z.string().min(1, "La unidad de consumo es requerida"),
    unidadEmpaqueId: z.string().optional(),
    cantidadPorEmpaque: z.coerce
      .number({ invalid_type_error: "El contenido por empaque debe ser un número" })
      .int("El contenido por empaque debe ser un número entero")
      .min(1, "El contenido por empaque debe ser al menos 1"),
    stockMinimo: z.coerce
      .number({ invalid_type_error: "El stock mínimo debe ser un número" })
      .int("El stock mínimo debe ser un número entero")
      .min(0, "El stock mínimo no puede ser negativo"),
    stockInicial: z.coerce
      .number({ invalid_type_error: "El stock inicial debe ser un número" })
      .int("El stock inicial debe ser un número entero")
      .min(0, "El stock inicial no puede ser negativo")
      .optional(),
    stockInicialEnEmpaques: z.boolean().optional(),
    activo: z.boolean().optional(),
  })
  .refine(
    (data) => !data.stockInicialEnEmpaques || !!data.unidadEmpaqueId,
    {
      message: "Para registrar el stock inicial en empaques debe elegir la unidad de empaque",
      path: ["stockInicialEnEmpaques"],
    }
  )
  .refine(
    (data) => !data.unidadEmpaqueId || data.unidadEmpaqueId !== data.unidadId,
    {
      message: "El empaque debe ser distinto a la unidad de consumo",
      path: ["unidadEmpaqueId"],
    }
  );

export type InsumoFormValues = z.infer<typeof InsumoSchema>;

export const MovimientoInsumoSchema = z
  .object({
    insumoId: z.string().min(1, "El insumo es requerido"),
    tipo: z.enum(["ENTRADA", "SALIDA"]),
    cantidad: z.coerce
      .number({ invalid_type_error: "La cantidad debe ser un número" })
      .int("La cantidad debe ser un número entero")
      .min(1, "La cantidad debe ser mayor a cero"),
    enEmpaques: z.boolean(),
    empleadoSolicitanteId: z.string().optional(),
    observaciones: z.string().optional(),
  })
  .refine(
    (data) => data.tipo === "ENTRADA" || !!data.empleadoSolicitanteId,
    {
      message: "Debe indicar el empleado que solicitó el insumo",
      path: ["empleadoSolicitanteId"],
    }
  );

export type MovimientoInsumoFormValues = z.infer<typeof MovimientoInsumoSchema>;
